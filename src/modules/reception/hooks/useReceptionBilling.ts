'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { billingService } from '@/services/billingService';
import {
  AppointmentResponse,
  PatientResponse,
  DoctorStaffResponse,
  BillingResponse,
} from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';

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
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictedToken, setPredictedToken] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [discount, setDiscount] = useState(0);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (appointmentId) {
        const [appRes, billRes] = await Promise.all([
          appointmentService.get(appointmentId),
          billingService.getByAppointment(appointmentId).catch(() => ({ success: false, data: null }))
        ]);

        if (appRes.success && appRes.data) {
          setAppointment(appRes.data);
          if (billRes.success && billRes.data) {
            setBilling(billRes.data);
            setDiscount(billRes.data.discount || 0);
            if (billRes.data.paymentMethod) setPaymentMethod(billRes.data.paymentMethod as any);
          }

          const [patRes, docRes] = await Promise.all([
            patientService.get(appRes.data.patientId),
            doctorService.get(appRes.data.doctorId),
          ]);
          if (patRes.success) setPatient(patRes.data || null);
          if (docRes.success) setDoctor(docRes.data || null);
        }
      } else if (patientIdParam && doctorIdParam) {
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

        // Fetch predicted token
        const date = appointmentTimeParam?.split('T')[0] || new Date().toISOString().split('T')[0];
        const statsRes = await appointmentService.listSummary(0, 1, undefined, date, doctorIdParam);
        if (statsRes.success && statsRes.data) {
          const nextNum = statsRes.data.totalElements + 1;
          setPredictedToken(`T-${nextNum.toString().padStart(3, '0')}`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch billing data', error);
      triggerGlobalToast('Failed to load billing details', 'error');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, patientIdParam, doctorIdParam, appointmentTimeParam, sessionPeriodParam, notesParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const consultationFee = doctor?.consultationFee || 0;
  const tax = 0;
  const total = Math.max(0, consultationFee - discount + tax);

  const handleMarkAsPaid = async () => {
    setSubmittingPayment(true);
    try {
      let currentAppointmentId = appointmentId;
      let currentAppointment = appointment;

      if (!appointmentId && patientIdParam && doctorIdParam && appointmentTimeParam) {
        const res = await appointmentService.create({
          patientId: patientIdParam,
          doctorId: doctorIdParam,
          appointmentTime: appointmentTimeParam,
          sessionPeriod: sessionPeriodParam,
          notes: notesParam || '',
          status: 'PAYMENT_PENDING'
        });
        if (res.success && res.data) {
          currentAppointmentId = res.data.id;
          currentAppointment = res.data;
        }
      }

      if (!currentAppointmentId || !currentAppointment || !patient) return;

      if (billing) {
        await billingService.updateStatus(billing.id!, 'PAID', paymentMethod, discount);
      } else {
        await billingService.create({
          patientId: patient.id,
          appointmentId: currentAppointmentId,
          sourceType: 'APPOINTMENT',
          status: 'PAID',
          totalAmount: consultationFee,
          discount: discount,
          paymentMethod: paymentMethod,
          items: [{ itemName: 'Consultation Fee', amount: consultationFee, quantity: 1, subtotal: consultationFee }]
        });
      }

      const updateRes = await appointmentService.update(currentAppointmentId, {
        ...currentAppointment,
        status: 'ADD_VITALS'
      });

      if (updateRes.success) {
        triggerGlobalToast('Payment confirmed successfully', 'success');
        if (appointmentId) fetchData();
        else router.push(`/reception/appointments/vitals?appointmentId=${currentAppointmentId}`);
      }
    } catch (error) {
      console.error('Payment Error:', error);
      triggerGlobalToast('Failed to process payment', 'error');
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
    billing,
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
