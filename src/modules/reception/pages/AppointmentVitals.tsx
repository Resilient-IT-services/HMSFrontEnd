'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { useReceptionVitals } from '@/modules/reception/hooks/useReceptionVitals';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { formatRangeHelper } from '@/utils/vitalsValidator';

export const AppointmentVitals = () => {
  const router = useRouter();
  const {
    appointment,
    patient,
    patientAge,
    loading,
    saving,
    systolic, setSystolic,
    diastolic, setDiastolic,
    heartRate, setHeartRate,
    temperature, setTemperature,
    tempUnit, setTempUnit,
    weight, setWeight,
    weightUnit, setWeightUnit,
    oxygenLevel, setOxygenLevel,
    respiratoryRate, setRespiratoryRate,
    complaints, setComplaints,
    vitalRanges,
    fieldErrors,
    validateField,
    handleSave
  } = useReceptionVitals();

  if (loading) {
    return (
      <MainLayout title="Capture Vitals">
        <div className="p-20 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing vital monitors...</p>
        </div>
      </MainLayout>
    );
  }

  if (!appointment) {
    return (
      <MainLayout title="Error">
        <div className="p-20 text-center">
          <Badge variant="red" size="md" className="mb-4">Appointment Not Found</Badge>
          <p className="text-slate-900 font-black text-xl mb-6">Unable to locate the visit record for vitals entry.</p>
          <Button icon="arrow_back" onClick={() => router.push('/reception/appointments')}>Return to Schedule</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Capture Vitals" hideTitle>
      <div className="p-8 max-w-[1200px] mx-auto w-full -m-8 bg-[#f9f9ff] min-h-screen font-inter pb-32">
        
        <PageHeading 
          title="Clinical Vitals Intake" 
          description="Capture primary physiological measurements to establish the patient's current health baseline."
        >

        </PageHeading>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Patient Profile Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-4xl uppercase mb-6 border-4 border-white shadow-sm">
                  {patient?.fullName.split(' ').map(n => n[0]).join('') || 'P'}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{patient?.fullName || appointment.patientName}</h3>
                <Badge variant="blue" className="mb-8">{patient?.gender || '--'} • {patientAge} Years</Badge>
                
                <div className="w-full space-y-4 pt-6 border-t border-slate-50">
                   <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="material-symbols-outlined text-orange-600 text-xl">fingerprint</span>
                      <div className="text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Patient Code</p>
                        <p className="font-bold text-slate-900 text-sm leading-none">{patient?.patientCode || 'N/A'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="material-symbols-outlined text-orange-600 text-xl">medical_services</span>
                      <div className="text-left">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Attending Physician</p>
                        <p className="font-bold text-slate-900 text-sm leading-none">Dr. {appointment.doctorName}</p>
                      </div>
                   </div>
                </div>
              </div>
            </Card>

            <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
               <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-9xl opacity-10 -rotate-12">monitor_heart</span>
               <h4 className="font-bold text-xs mb-3 flex items-center gap-2 uppercase tracking-widest opacity-60">
                 Clinical Protocol
               </h4>
               <p className="text-sm font-medium leading-relaxed italic">
                 "Ensure the patient has rested for at least 5 minutes before recording blood pressure to prevent white-coat effect errors."
               </p>
            </div>
          </div>

          {/* Vitals Entry Form */}
          <div className="lg:col-span-8 space-y-6">
            <Card title="Clinical Measurements" icon="monitoring">
              <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                
                {/* Blood Pressure Row */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arterial Blood Pressure (mmHg)</label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Systolic"
                          className={`w-full p-4 bg-slate-50 border rounded-xl font-black text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.systolic ? 'border-red-500' : 'border-slate-100'}`}
                          value={systolic}
                          onChange={(e) => { setSystolic(e.target.value); validateField('systolic', e.target.value); }}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">SYS</span>
                      </div>
                      {fieldErrors.systolic && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{fieldErrors.systolic}</p>}
                    </div>
                    
                    <span className="text-4xl font-black text-slate-200 mt-1">/</span>
                    
                    <div className="flex-1">
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Diastolic"
                          className={`w-full p-4 bg-slate-50 border rounded-xl font-black text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.diastolic ? 'border-red-500' : 'border-slate-100'}`}
                          value={diastolic}
                          onChange={(e) => { setDiastolic(e.target.value); validateField('diastolic', e.target.value); }}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">DIA</span>
                      </div>
                      {fieldErrors.diastolic && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{fieldErrors.diastolic}</p>}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Normal range: {formatRangeHelper(vitalRanges.SYSTOLIC_BP)} / {formatRangeHelper(vitalRanges.DIASTOLIC_BP)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Heart Rate */}
                  <FormField 
                    label="Heart Rate (BPM)" 
                    error={fieldErrors.heartRate}
                    className="mb-0"
                  >
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="e.g. 72"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none"
                        value={heartRate}
                        onChange={(e) => { setHeartRate(e.target.value); validateField('heartRate', e.target.value); }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-orange-600">favorite</span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic mt-1">Range: {formatRangeHelper(vitalRanges.HEART_RATE)}</p>
                  </FormField>

                  {/* Oxygen Level */}
                  <FormField 
                    label="Oxygen Level (SpO2 %)" 
                    error={fieldErrors.oxygenLevel}
                    className="mb-0"
                  >
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="e.g. 98"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none"
                        value={oxygenLevel}
                        onChange={(e) => { setOxygenLevel(e.target.value); validateField('oxygenLevel', e.target.value); }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-blue-600">pulse_alert</span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic mt-1">Range: {formatRangeHelper(vitalRanges.OXYGEN_LEVEL)}</p>
                  </FormField>

                  {/* Body Temperature */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Body Temperature</label>
                      <select 
                        className="text-[10px] font-black bg-slate-100 border-none rounded px-2 py-1 uppercase tracking-tight outline-none"
                        value={tempUnit}
                        onChange={(e) => setTempUnit(e.target.value as any)}
                      >
                        <option value="CELSIUS">°C Celsius</option>
                        <option value="FAHRENHEIT">°F Fahrenheit</option>
                      </select>
                    </div>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder={tempUnit === 'CELSIUS' ? 'e.g. 36.6' : 'e.g. 98.6'}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none"
                        value={temperature}
                        onChange={(e) => { setTemperature(e.target.value); validateField('temperature', e.target.value); }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{tempUnit === 'CELSIUS' ? '°C' : '°F'}</span>
                    </div>
                    {fieldErrors.temperature && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{fieldErrors.temperature}</p>}
                    <p className="text-[10px] text-slate-400 italic mt-1">Range: {formatRangeHelper(vitalRanges.BODY_TEMPERATURE)}</p>
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Weight</label>
                      <select 
                        className="text-[10px] font-black bg-slate-100 border-none rounded px-2 py-1 uppercase tracking-tight outline-none"
                        value={weightUnit}
                        onChange={(e) => setWeightUnit(e.target.value as any)}
                      >
                        <option value="KG">KG (Kilos)</option>
                        <option value="LB">LB (Pounds)</option>
                      </select>
                    </div>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder={weightUnit === 'KG' ? 'e.g. 75.0' : 'e.g. 165.3'}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none"
                        value={weight}
                        onChange={(e) => { setWeight(e.target.value); validateField('weight', e.target.value); }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold lowercase">{weightUnit}</span>
                    </div>
                    {fieldErrors.weight && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{fieldErrors.weight}</p>}
                    <p className="text-[10px] text-slate-400 italic mt-1">Range: {formatRangeHelper(vitalRanges.WEIGHT)}</p>
                  </div>

                </div>

                {/* Chief Complaints */}
                <div className="pt-4 border-t border-slate-50">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Patient Symptoms & Complaints</label>
                   <textarea 
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none resize-none"
                    placeholder="Document current symptoms, duration, and patient's primary concern..."
                    rows={5}
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                   />
                </div>

              </form>

            </Card>
            <Button
                icon="check_circle"
                size="xl"
                isLoading={saving}
                onClick={() => handleSave()}
                className="px-10 ml-120"
            >
              {saving ? 'Saving Data...' : 'Confirm & Submit'}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
