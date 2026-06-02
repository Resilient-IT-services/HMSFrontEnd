'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { invoiceService } from '@/services/invoiceService';
import { hospitalService } from '@/services/hospitalService';
import { taxService } from '@/services/taxService';
import { AppointmentResponse, PatientResponse, DoctorStaffResponse, InvoiceDTO, TaxCalculationResult, HospitalResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { getHospitalDayRangeUTC } from '@/utils/dateValidator';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

const APPOINTMENT_CONFLICT_MESSAGE = 'Appointment already exists for this patient with the same doctor at the selected time';

export const useReceptionBilling = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hospitalTimezone } = useSelector((state: RootState) => state.auth);

  // Params for "New Booking" scenario
  const patientIdParam = searchParams.get('patientId');
  const doctorIdParam = searchParams.get('doctorId');
  const appointmentTimeParam = searchParams.get('appointmentTime');
  const notesParam = searchParams.get('notes');
  const sessionPeriodParam = searchParams.get('sessionPeriod') as any;

  // Param for "Pay for Existing" scenario
  const appointmentId = searchParams.get('appointmentId');

  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [doctor, setDoctor] = useState<DoctorStaffResponse | null>(null);
  const [hospital, setHospital] = useState<HospitalResponse | null>(null);
  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  
  const [predictedToken, setPredictedToken] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [discount, setDiscount] = useState(0);

  const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null);
  const [calculatingTax, setCalculatingTax] = useState(false);

  const applyInvoiceData = (inv: InvoiceDTO | null) => {
    setInvoice(inv);
    if (inv) {
      setDiscount(inv.discountAmount || 0);
    }
  };

  const calculateTax = useCallback(async (fee: number, disc: number) => {
    if (!user?.currentHospitalId || fee <= 0) return;
    
    setCalculatingTax(true);
    try {
      // Get hospital state if not already fetched
      let hState = hospital?.state;
      if (!hState) {
        const hRes = await hospitalService.getById(user.currentHospitalId);
        if (hRes.success && hRes.data) {
          setHospital(hRes.data);
          hState = hRes.data.state;
        }
      }

      const taxableAmount = Math.max(0, fee - disc);
      const res = await taxService.calculate({
        hospitalId: user.currentHospitalId,
        itemType: 'CONSULTATION',
        itemCode: doctor?.doctorId,
        hsnOrSacCode: '9993', // SAC for medical services
        quantity: 1,
        unitPrice: fee,
        taxableAmount,
        hospitalState: hState,
        billingState: patient?.address?.split(',').pop()?.trim() || hState, // Fallback to hospital state
        isTaxInclusive: false
      });

      if (res.success && res.data) {
        setTaxResult(res.data);
      }
    } catch (error) {
      console.error('Tax Calculation Error:', error);
    } finally {
      setCalculatingTax(false);
    }
  }, [user, hospital, doctor, patient]);

  const fetchData = useCallback(async () => {
    if (!appointmentId) return;

    try {
      setLoading(true);
      const res = await appointmentService.get(appointmentId);
      if (res.success && res.data) {
        setAppointment(res.data);
        
        const [invRes, patRes, docRes] = await Promise.all([
          invoiceService.getByVisit(res.data.visitId!).catch(() => ({ success: false, data: null })),
          patientService.get(res.data.patientId),
          doctorService.get(res.data.doctorId),
        ]);

        if (invRes.success) applyInvoiceData(invRes.data || null);
        if (patRes.success) setPatient(patRes.data || null);
        if (docRes.success) setDoctor(docRes.data || null);
      }
    } catch (error) {
      console.error('Billing Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  const loadNewAppointmentBilling = useCallback(async () => {
    if (!patientIdParam || !doctorIdParam || !hospitalTimezone) return;

    try {
      setLoading(true);
      
      // Check if an appointment already exists for this patient/time
      // to handle "back" navigation or duplicate submissions gracefully
      const { from, to } = getHospitalDayRangeUTC(hospitalTimezone, appointmentTimeParam || undefined);
      const existingRes = await appointmentService.list({
        page: 0, 
        size: 1, 
        from, 
        to, 
        doctorId: doctorIdParam
      });
      if (existingRes.success && existingRes.data && existingRes.data.content.length > 0) {
        const existing = existingRes.data.content.find(a => 
          a.patientId === patientIdParam && 
          (appointmentTimeParam ? a.appointmentTime === appointmentTimeParam : true) &&
          a.status !== 'CANCELLED'
        );
        
        if (existing) {
          setAppointment(existing);
          
          const [invRes, patRes, docRes] = await Promise.all([
            invoiceService.getByVisit(existing.visitId!).catch(() => ({ success: false, data: null })),
            patientService.get(existing.patientId),
            doctorService.get(existing.doctorId),
          ]);

          if (invRes.success) applyInvoiceData(invRes.data || null);
          if (patRes.success) setPatient(patRes.data || null);
          if (docRes.success) setDoctor(docRes.data || null);
          return;
        }
      }

      const [patRes, docRes] = await Promise.all([
        patientService.get(patientIdParam),
        doctorService.get(doctorIdParam),
      ]);
      if (patRes.success) setPatient(patRes.data || null);
      if (docRes.success) setDoctor(docRes.data || null);

      setAppointment({
        id: 'TEMP',
        patientId: patientIdParam,
        patientName: patRes.data?.fullName || 'N/A',
        doctorId: doctorIdParam,
        doctorName: docRes.data?.fullName || 'N/A',
        appointmentTime: appointmentTimeParam || new Date().toISOString(),
        sessionPeriod: sessionPeriodParam,
        status: 'PAYMENT_PENDING',
        notes: notesParam || '',
        createdAt: new Date().toISOString()
      } as any);

      const statsRes = await appointmentService.listSummary({
        page: 0, 
        size: 1, 
        from, 
        to, 
        doctorId: doctorIdParam
      });
      if (statsRes.success && statsRes.data) {
        setPredictedToken(String(statsRes.data.totalElements + 1));
      }
    } catch (error) {
      console.error('Initial Billing Load Error:', error);
    } finally {
      setLoading(false);
    }
  }, [patientIdParam, doctorIdParam, appointmentTimeParam, notesParam, sessionPeriodParam, hospitalTimezone]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (appointmentId) {
        fetchData();
      } else {
        loadNewAppointmentBilling();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [appointmentId, fetchData, loadNewAppointmentBilling]);

  useEffect(() => {
    if (doctor?.consultationFee && !invoice) {
      const timer = setTimeout(() => {
        void calculateTax(doctor.consultationFee, discount);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [doctor?.consultationFee, discount, invoice, calculateTax]);

  const consultationFee = doctor?.consultationFee || 0;
  const total = taxResult ? taxResult.grandTotal : Math.max(0, (invoice?.totalAmount ?? consultationFee) - discount);

  const getAppointmentSubmitErrorMessage = (error: unknown) => {
    if (isAxiosError(error) && error.response?.data?.message?.includes('already exists')) {
      return APPOINTMENT_CONFLICT_MESSAGE;
    }
    return 'Failed to process payment';
  };

  const handleMarkAsPaid = async () => {
    setSubmittingPayment(true);
    try {
      // Scenario 1: Paying for an EXISTING appointment (Invoice already exists)
      if (appointmentId && appointment && invoice) {
        const res = await invoiceService.recordPayment({
          patientId: appointment.patientId,
          visitId: appointment.visitId,
          amount: total,
          paymentMode: paymentMethod,
          invoiceId: invoice.id,
          referenceNumber: `BILL-${Date.now()}`,
          taxAmount: invoice.taxAmount,
          taxableAmount: invoice.taxableAmount,
          appliedTaxes: invoice.items[0]?.appliedTaxes // Standard OPD usually has one item
        });

        if (res.success) {
          triggerGlobalToast('Payment recorded successfully', 'success');
          // Refresh data to show PAID status
          void fetchData();
          return appointment;
        }
        return null;
      }

      // Scenario 2: NEW Booking (Atomic Book + Pay)
      if (!patientIdParam || !doctorIdParam || !appointmentTimeParam || !patient) {
         triggerGlobalToast('Missing required booking information', 'error');
         return null;
      }

      const res = await appointmentService.bookConsultation({
        patientId: patientIdParam,
        doctorId: doctorIdParam,
        appointmentTime: appointmentTimeParam,
        notes: notesParam || '',
        payment: {
          amount: total,
          mode: paymentMethod,
          referenceNumber: `BILL-${Date.now()}`,
          taxAmount: taxResult?.totalTax,
          taxableAmount: taxResult?.taxableAmount,
          appliedTaxes: taxResult?.components
        }
      });

      if (res.success && res.data) {
        triggerGlobalToast('Consultation booked and payment confirmed successfully', 'success');
        return res.data;
      }
      return null;
    } catch (error) {
      console.error('Payment Error:', error);
      triggerGlobalToast(getAppointmentSubmitErrorMessage(error), 'error');
      return null;
    } finally {
      setSubmittingPayment(false);
    }
  };

  const generateBill = async () => {
     if (!appointment || !invoice) return;
     try {
       triggerGlobalToast('Generating invoice...', 'info');
       const blob = await invoiceService.exportPdf(invoice.id);
       const url = globalThis.URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `invoice_${invoice.invoiceNumber}.pdf`);
       document.body.append(link);
       link.click();
       link.remove();
     } catch (error) {
       console.error('Invoice Generation Error:', error);
       triggerGlobalToast('Failed to generate invoice', 'error');
     }
  };

  const downloadReceipt = async () => {
    // Similar to generateBill but for payment receipt
  };

  return {
    appointment,
    patient,
    doctor,
    loading,
    predictedToken,
    paymentMethod,
    setPaymentMethod,
    discount,
    setDiscount,
    submittingPayment,
    consultationFee,
    total,
    handleMarkAsPaid,
    generateBill,
    downloadReceipt,
    invoice,
    taxResult,
    calculatingTax,
    isPaid: appointment?.status !== 'PAYMENT_PENDING'
  };
};
