'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { invoiceService } from '@/services/invoiceService';
import {
  AppointmentResponse,
  PatientResponse,
  DoctorStaffResponse,
  InvoiceDTO,
} from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';

const APPOINTMENT_CONFLICT_MESSAGE = 'Appointment already exists for this patient with the same doctor at the selected time';

const getAppointmentSubmitErrorMessage = (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 409) {
    const apiData = error.response.data as any;
    return apiData?.error?.message || apiData?.message || APPOINTMENT_CONFLICT_MESSAGE;
  }

  return 'Failed to process payment';
};

export const useReceptionBilling = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');
  const patientIdParam = searchParams.get('patientId');
  const doctorIdParam = searchParams.get('doctorId');
  const appointmentTimeParam = searchParams.get('appointmentTime');
  const sessionPeriodParam = searchParams.get('sessionPeriod') as any;
  const notesParam = searchParams.get('notes');

  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [doctor, setDoctor] = useState<DoctorStaffResponse | null>(null);
  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictedToken, setPredictedToken] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [discount, setDiscount] = useState(0);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const applyInvoiceData = useCallback((invoiceData: InvoiceDTO | null) => {
    if (!invoiceData) return;

    setInvoice(invoiceData);
    setDiscount(invoiceData.discountAmount || 0);
    // Since InvoiceDTO doesn't have a single payment method (it can have multiple payments), 
    // we just keep the default or use the first payment's mode if needed.
  }, []);

  const loadExistingAppointmentBilling = useCallback(async (id: string) => {
    const appRes = await appointmentService.get(id);
    if (!appRes.success || !appRes.data) return;

    setAppointment(appRes.data);
    
    const [invRes, patRes, docRes] = await Promise.all([
      invoiceService.getByVisit(appRes.data.visitId!).catch(() => ({ success: false, data: null })),
      patientService.get(appRes.data.patientId),
      doctorService.get(appRes.data.doctorId),
    ]);

    if (invRes.success) applyInvoiceData(invRes.data || null);
    if (patRes.success) setPatient(patRes.data || null);
    if (docRes.success) setDoctor(docRes.data || null);
  }, [applyInvoiceData]);

  const loadNewAppointmentBilling = useCallback(async () => {
    if (!patientIdParam || !doctorIdParam) return;

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

    const date = appointmentTimeParam?.split('T')[0] || new Date().toISOString().split('T')[0];
    const statsRes = await appointmentService.listSummary(0, 1, undefined, date, doctorIdParam);
    if (statsRes.success && statsRes.data) {
      const nextNum = statsRes.data.totalElements + 1;
      setPredictedToken(`T-${nextNum.toString().padStart(3, '0')}`);
    }
  }, [appointmentTimeParam, doctorIdParam, notesParam, patientIdParam, sessionPeriodParam]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (appointmentId) {
        await loadExistingAppointmentBilling(appointmentId);
      } else if (patientIdParam && doctorIdParam) {
        await loadNewAppointmentBilling();
      }
    } catch (error) {
      console.error('Failed to fetch billing data', error);
      triggerGlobalToast('Failed to load billing details', 'error');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, doctorIdParam, loadExistingAppointmentBilling, loadNewAppointmentBilling, patientIdParam]);

  useEffect(() => {
    const trigger = async () => {
      await fetchData();
    };
    void trigger();
  }, [fetchData]);

  const consultationFee = doctor?.consultationFee || 0;
  const tax = 0;
  const total = Math.max(0, consultationFee - discount + tax);

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
          referenceNumber: `BILL-${Date.now()}`
        });

        if (res.success) {
          triggerGlobalToast('Payment recorded successfully', 'success');
          // Refresh data to show PAID status
          void fetchData();
        }
        return;
      }

      // Scenario 2: NEW Booking (Atomic Book + Pay)
      if (!patientIdParam || !doctorIdParam || !appointmentTimeParam || !patient) {
         triggerGlobalToast('Missing required booking information', 'error');
         return;
      }

      const res = await appointmentService.bookConsultation({
        patientId: patientIdParam,
        doctorId: doctorIdParam,
        appointmentTime: appointmentTimeParam,
        notes: notesParam || '',
        payment: {
          amount: total,
          mode: paymentMethod,
          referenceNumber: `BILL-${Date.now()}`
        }
      });

      if (res.success && res.data) {
        triggerGlobalToast('Consultation booked and payment confirmed successfully', 'success');
        router.push(`/reception/appointments/vitals?appointmentId=${res.data.id}`);
      }
    } catch (error) {
      console.error('Payment Error:', error);
      triggerGlobalToast(getAppointmentSubmitErrorMessage(error), 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const generateBill = () => {
    triggerGlobalToast('Bill generated', 'success');
    globalThis.print();
  };

  const downloadReceipt = () => {
    const element = document.createElement('a');
    const file = new Blob(['Mock Bill Content'], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `bill_${appointmentId || 'new'}.txt`;
    document.body.append(element);
    element.click();
    element.remove();
  };

  return {
    appointment,
    patient,
    doctor,
    invoice,
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
    isPaid: appointment?.status !== 'PAYMENT_PENDING'
  };
};
