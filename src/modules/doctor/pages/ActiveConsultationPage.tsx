'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken } from '@/utils/tokenHelper';
import DigitalPrescription from '@/components/doctor/DigitalPrescription';

export const ActiveConsultationPage = () => {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;
    try {
      setLoading(true);
      const res = await appointmentService.get(appointmentId);
      if (res.success && res.data) {
        setAppointment(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
      triggerGlobalToast('Failed to fetch appointment details', 'error');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const handleComplete = async () => {
    if (!appointmentId) return;
    try {
      const statusRes = await appointmentService.updateStatus(appointmentId, { status: 'COMPLETED' });
      if (statusRes.success) {
        triggerGlobalToast('Consultation completed successfully', 'success');
        globalThis.location.href = '/doctor/dashboard';
      }
    } catch (error) {
      console.error('Failed to complete consultation:', error);
      triggerGlobalToast('Failed to complete consultation', 'error');
    }
  };

  if (loading) return <MainLayout title="Active Consultation">Loading...</MainLayout>;
  if (!appointment) return <MainLayout title="Active Consultation">Appointment not found</MainLayout>;

  return (
    <MainLayout title={`Consultation: ${appointment.patientName}`}>
      <DigitalPrescription
        appointmentId={appointment.id}
        patientId={appointment.patientId}
        patientName={appointment.patientName}
        onComplete={handleComplete}
        vitals={{
          heartRate: appointment?.vitals?.heartRate?.toString() || '--',
          temp: appointment?.vitals?.temperature?.toString() || '--',
          bp: appointment?.vitals?.bloodPressure || '--',
          weight: appointment?.vitals?.weight?.toString() || '--',
          spo2: appointment?.vitals?.oxygenLevel?.toString() || '--'
        }}
        date={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        tokenDisplay={formatToken(appointment)}
      />
    </MainLayout>
  );
};
