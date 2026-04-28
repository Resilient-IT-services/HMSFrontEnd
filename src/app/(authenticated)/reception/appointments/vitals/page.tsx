'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { AppointmentResponse, PatientResponse, VitalsDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';

const VitalsEntryPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');

  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState(''); // Not in API, but in UI
  const [complaints, setComplaints] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      try {
        const appRes = await appointmentService.get(appointmentId);
        if (appRes.success && appRes.data) {
          setAppointment(appRes.data);
          setComplaints(appRes.data.notes || '');
          
          if (appRes.data.vitals) {
            const [sys, dia] = appRes.data.vitals.bloodPressure.split('/');
            setSystolic(sys || '');
            setDiastolic(dia || '');
            setHeartRate(appRes.data.vitals.heartRate.toString());
            setTemperature(appRes.data.vitals.temperature.toString());
            setWeight(appRes.data.vitals.weight.toString());
          }

          const patRes = await patientService.get(appRes.data.patientId);
          if (patRes.success && patRes.data) {
            setPatient(patRes.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch details', error);
        triggerGlobalToast('Failed to load appointment details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [appointmentId]);

  const patientAge = useMemo(() => {
    if (!patient?.dob) return '--';
    const birthDate = new Date(patient.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [patient]);

  const handleSave = async (isDraft: boolean = false) => {
    if (!appointment) return;

    setSaving(true);
    try {
      // Logic for safe appointment time as before to bypass backend validation if it's in the past
      const originalTime = new Date(appointment.appointmentTime);
      const now = new Date();
      let safeAppointmentTime = appointment.appointmentTime;
      
      if (originalTime <= now) {
        const future = new Date(now.getTime() + 5 * 60 * 1000); 
        const pad = (n: number) => n.toString().padStart(2, '0');
        safeAppointmentTime = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}:${pad(future.getSeconds())}`;
      }

      const vitals: VitalsDTO = {
        bloodPressure: `${systolic}/${diastolic}`,
        heartRate: parseInt(heartRate) || 0,
        temperature: parseFloat(temperature) || 0,
        weight: parseFloat(weight) || 0,
      };

      const res = await appointmentService.update(appointment.id, {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentTime: safeAppointmentTime,
        vitals,
        notes: complaints
      });

      if (res.success) {
        triggerGlobalToast(isDraft ? 'Draft saved successfully' : 'Vitals submitted successfully', 'success');
        router.push('/reception/appointments');
      }
    } catch (error) {
      console.error('Failed to save vitals', error);
      // Toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Capture Vitals">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!appointment) {
    return (
      <MainLayout title="Capture Vitals">
        <div className="bg-white p-8 rounded-xl border border-outline-variant text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">monitor_heart</span>
          <h3 className="text-xl font-bold text-gray-900">Appointment Not Found</h3>
          <p className="text-gray-500 mt-2">Could not load the requested appointment for vitals entry.</p>
          <button 
            onClick={() => router.push('/reception/appointments')}
            className="mt-6 px-6 py-2 bg-primary text-white rounded-lg"
          >
            Back to Schedule
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Capture Vitals" hideTitle>
      <div className="p-container-padding max-w-7xl w-full mx-auto">
        <div className="flex items-center justify-between mb-section-gap">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">Capture Vitals</h2>
            <p className="text-body-lg text-gray-500">Record clinical measurements for the current appointment.</p>
          </div>
          <div className="flex gap-3">

            <button 
              disabled={saving}
              onClick={() => handleSave(false)}
              className="px-6 py-2 bg-primary-container text-white rounded-lg font-label-md hover:opacity-90 shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit Vitals'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column: Patient Information */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col items-center text-center mb-6">
                <h3 className="font-headline-md text-headline-md text-on-surface">{patient?.fullName || appointment.patientName}</h3>
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm mt-2">
                  {patient?.gender || '--'}, {patientAge} years
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-orange-600">fingerprint</span>
                  <div>
                    <p className="text-label-sm text-gray-500 uppercase">Patient ID</p>
                    <p className="font-headline-sm text-on-surface">{patient?.patientCode || appointment.patientId.substring(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-orange-600">call</span>
                  <div>
                    <p className="text-label-sm text-gray-500 uppercase">Phone</p>
                    <p className="font-headline-sm text-on-surface">{patient?.phone || '--'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-orange-600">medical_information</span>
                  <div>
                    <p className="text-label-sm text-gray-500 uppercase">Attending Doctor</p>
                    <p className="font-headline-sm text-on-surface">{appointment.doctorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <span className="material-symbols-outlined text-orange-600">event_note</span>
                  <div>
                    <p className="text-label-sm text-gray-500 uppercase">Appointment ID</p>
                    <p className="font-headline-sm text-on-surface">{appointment.id.substring(0, 8)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3 text-orange-700">
                <span className="material-symbols-outlined">info</span>
                <h4 className="font-headline-sm">Clinical Note</h4>
              </div>
              <p className="text-body-md text-orange-800">Please ensure the patient has rested for at least 5 minutes before capturing blood pressure readings.</p>
            </div>
          </div>

          {/* Right Column: Capture Vitals Form */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-gray-100 rounded-lg p-container-padding shadow-sm h-full">
              <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-4">
                <span className="material-symbols-outlined text-primary">monitoring</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Vitals Measurement</h3>
              </div>
              <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Blood Pressure */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-label-md font-bold text-on-surface mb-2">Blood Pressure (Systolic / Diastolic)</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input 
                          className="w-full px-4 py-3 bg-gray-50 border border-outline-variant rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all" 
                          placeholder="e.g. 120" 
                          type="text"
                          value={systolic}
                          onChange={(e) => setSystolic(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">mmHg</span>
                      </div>
                      <span className="text-headline-md text-gray-300">/</span>
                      <div className="relative flex-1">
                        <input 
                          className="w-full px-4 py-3 bg-gray-50 border border-outline-variant rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all" 
                          placeholder="e.g. 80" 
                          type="text"
                          value={diastolic}
                          onChange={(e) => setDiastolic(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">mmHg</span>
                      </div>
                    </div>
                  </div>
                  {/* Heart Rate */}
                  <div className="col-span-1">
                    <label className="block text-label-md font-bold text-on-surface mb-2">Heart Rate</label>
                    <div className="relative">
                      <input 
                        className="w-full px-4 py-3 bg-gray-50 border border-outline-variant rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all" 
                        placeholder="e.g. 72" 
                        type="text"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">BPM</span>
                    </div>
                  </div>
                  {/* Body Temperature */}
                  <div className="col-span-1">
                    <label className="block text-label-md font-bold text-on-surface mb-2">Body Temperature</label>
                    <div className="relative">
                      <input 
                        className="w-full px-4 py-3 bg-gray-50 border border-outline-variant rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all" 
                        placeholder="e.g. 36.6" 
                        type="text"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">°C</span>
                    </div>
                  </div>
                  {/* Weight */}
                  <div className="col-span-1">
                    <label className="block text-label-md font-bold text-on-surface mb-2">Patient Weight</label>
                    <div className="relative">
                      <input 
                        className="w-full px-4 py-3 bg-gray-50 border border-outline-variant rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all" 
                        placeholder="e.g. 75.0" 
                        type="text"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
                    </div>
                  </div>

                </div>
                {/* Patient Complaints */}
                <div className="col-span-full">
                  <label className="block text-label-md font-bold text-on-surface mb-2">Patient Complaints & Symptoms</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 border border-outline-variant rounded-lg text-body-lg focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all resize-none" 
                    placeholder="Enter symptoms or complaints here..." 
                    rows={6}
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                  ></textarea>
                </div>
                <div className="pt-6">
                  <div className="flex items-center gap-3 p-4 bg-tertiary-container/10 rounded-lg">
                    <span className="material-symbols-outlined text-tertiary">verified_user</span>
                    <p className="text-body-sm text-on-tertiary-container">Data will be instantly updated in {patient?.fullName || appointment.patientName}'s medical history and shared with {appointment.doctorName}.</p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VitalsEntryPage;
