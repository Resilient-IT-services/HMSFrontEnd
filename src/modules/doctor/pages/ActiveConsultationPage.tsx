'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { AppointmentResponse, PatientResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken } from '@/utils/tokenHelper';
import DigitalPrescription from '@/components/doctor/DigitalPrescription';
import { Button } from '@/components/ui/Button';

export const ActiveConsultationPage = () => {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;
    try {
      setLoading(true);
      const res = await appointmentService.get(appointmentId);
      if (res.success && res.data) {
        setAppointment(res.data);
        const pRes = await patientService.get(res.data.patientId);
        if (pRes.success && pRes.data) {
          setPatient(pRes.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
      triggerGlobalToast('Failed to fetch appointment details', 'error');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    const trigger = async () => {
      await fetchAppointment();
    };
    void trigger();
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
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">{appointment.patientName}</h2>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{formatToken(appointment)}</p>
          </div>
          <Button 
            onClick={handleComplete}
            icon="task_alt"
          >
            Complete Consultation
          </Button>
        </div>
        
        <div className="flex-1 relative bg-slate-100 overflow-y-auto">
          <DigitalPrescription
            isOpen={true}
            onClose={() => {}}
            patient={patient}
            doctor={null}
            hospital={null}
            complaints=""
            diagnosis=""
            prescriptions={[]}
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
        </div>
      </div>
    </MainLayout>
  );
};
