'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { useReceptionVitals } from '@/modules/reception/hooks/useReceptionVitals';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { PageHeading } from '@/components/ui/PageHeading';
import { InfoRow } from '@/components/ui/InfoRow';

export const AppointmentVitals = () => {
  const router = useRouter();
  const {
    appointment,
    patient,
    patientAge,
    systolic, setSystolic,
    diastolic, setDiastolic,
    heartRate, setHeartRate,
    temperature, setTemperature,
    weight, setWeight,
    oxygenLevel, setOxygenLevel,
    respiratoryRate, setRespiratoryRate,
    complaints, setComplaints,
    fieldErrors,
    saving,
    handleSave,
  } = useReceptionVitals();

  if (!appointment) {
    return (
        <MainLayout title="Error">
          <div className="p-10 text-center">
            <Badge variant="red" size="md" className="mb-2">Appointment Not Found</Badge>
            <p className="text-slate-900 font-black text-lg mb-4">Unable to locate the record.</p>
            <Button icon="arrow_back" onClick={() => router.push('/reception/appointments')}>Return</Button>
          </div>
        </MainLayout>
    );
  }

  const isReadOnly = ['CONSULTATION_STARTED', 'PRESCRIPTION_FINALIZED', 'COMPLETED', 'CANCELLED'].includes(appointment.status);

  const renderPatientSummary = () => (
    <div className="lg:col-span-1 space-y-4">
      <Card title="Patient Profile" icon="person" className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-4xl text-slate-400">account_circle</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">{patient?.fullName || appointment.patientName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="blue">{patientAge} Years</Badge>
              <Badge variant="slate">{patient?.gender || '--'}</Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            <InfoRow label="Patient ID" value={patient?.patientCode || '--'} icon="id_card" />
            <InfoRow label="Visit Token" value={appointment.tokenNumber || '--'} icon="confirmation_number" />
            <InfoRow label="Doctor" value={`Dr. ${appointment.doctorName}`} icon="medical_services" />
          </div>
        </div>
      </Card>

      <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">Protocol Note</h4>
          <p className="text-xs font-medium leading-relaxed italic">
            "Ensure the patient has rested for 5 minutes before recording blood pressure for accurate systolic/diastolic readings."
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <span className="material-symbols-outlined text-8xl">clinical_notes</span>
        </div>
      </div>
    </div>
  );

  const renderVitalsForm = () => (
    <div className="lg:col-span-3 space-y-4">
      <Card title="Clinical Measurements" icon="monitoring" className="p-6">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); if(!isReadOnly) handleSave(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Blood Pressure (mmHg)" error={fieldErrors.systolic || fieldErrors.diastolic}>
              <div className="flex items-center gap-3">
                <input
                  type="text" placeholder="Sys" disabled={isReadOnly}
                  className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black focus:ring-2 focus:ring-orange-500 outline-none text-center ${fieldErrors.systolic ? 'border-red-500 bg-red-50' : ''}`}
                  value={systolic} onChange={(e) => setSystolic(e.target.value.replaceAll(/\D/g, ''))}
                />
                <span className="text-slate-300 font-bold">/</span>
                <input
                  type="text" placeholder="Dia" disabled={isReadOnly}
                  className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black focus:ring-2 focus:ring-orange-500 outline-none text-center ${fieldErrors.diastolic ? 'border-red-500 bg-red-50' : ''}`}
                  value={diastolic} onChange={(e) => setDiastolic(e.target.value.replaceAll(/\D/g, ''))}
                />
              </div>
            </FormField>

            <FormField label="Heart Rate (BPM)" error={fieldErrors.heartRate}>
              <input
                type="text" placeholder="e.g. 72" disabled={isReadOnly}
                className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black focus:ring-2 focus:ring-orange-500 outline-none ${fieldErrors.heartRate ? 'border-red-500 bg-red-50' : ''}`}
                value={heartRate} onChange={(e) => setHeartRate(e.target.value.replaceAll(/\D/g, ''))}
              />
            </FormField>

            <FormField label="Temperature (°F)" error={fieldErrors.temperature}>
              <input
                type="text" placeholder="e.g. 98.6" disabled={isReadOnly}
                className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black focus:ring-2 focus:ring-orange-500 outline-none ${fieldErrors.temperature ? 'border-red-500 bg-red-50' : ''}`}
                value={temperature} onChange={(e) => setTemperature(e.target.value)}
              />
            </FormField>

            <FormField label="Oxygen SpO2 (%)" error={fieldErrors.oxygenLevel}>
              <input
                type="text" placeholder="e.g. 98" disabled={isReadOnly}
                className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black focus:ring-2 focus:ring-orange-500 outline-none ${fieldErrors.oxygenLevel ? 'border-red-500 bg-red-50' : ''}`}
                value={oxygenLevel} onChange={(e) => setOxygenLevel(e.target.value.replaceAll(/\D/g, ''))}
              />
            </FormField>

            <FormField label="Body Weight (kg)">
              <input
                type="text" placeholder="e.g. 70" disabled={isReadOnly}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black focus:ring-2 focus:ring-orange-500 outline-none"
                value={weight} onChange={(e) => setWeight(e.target.value)}
              />
            </FormField>

            <FormField label="Respiratory Rate">
              <input
                type="text" placeholder="e.g. 16" disabled={isReadOnly}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black focus:ring-2 focus:ring-orange-500 outline-none"
                value={respiratoryRate} onChange={(e) => setRespiratoryRate(e.target.value.replaceAll(/\D/g, ''))}
              />
            </FormField>
          </div>

          <FormField label="Chief Complaints">
            <textarea
              rows={3} disabled={isReadOnly}
              placeholder="Document patient's primary symptoms..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              value={complaints} onChange={(e) => setComplaints(e.target.value)}
            />
          </FormField>

          {!isReadOnly && (
            <div className="pt-4">
              <Button
                type="submit" disabled={saving}
                className="w-full sm:w-auto px-12 py-3 shadow-lg shadow-orange-600/20"
                icon={saving ? 'sync' : 'check_circle'}
              >
                {saving ? 'Processing...' : 'Submit Clinical Vitals'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );

  return (
    <MainLayout title="Capture Vitals" hideTitle>
      <PageHeading 
        title={isReadOnly ? "View Recorded Vitals" : "Clinical Vitals Intake"} 
        description={isReadOnly ? "Viewing finalized physiological measurements for this visit." : "Capture primary physiological measurements to establish the patient's current health baseline."}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {renderPatientSummary()}
        {renderVitalsForm()}
      </div>
    </MainLayout>
  );
};
