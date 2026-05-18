'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { useReceptionVitals } from '@/modules/reception/hooks/useReceptionVitals';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
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
    displayTempUnit, setDisplayTempUnit,
    weight, setWeight,
    displayWeightUnit, setDisplayWeightUnit,
    oxygenLevel, setOxygenLevel,
    respiratoryRate, setRespiratoryRate,
    complaints, setComplaints,
    vitalRanges,
    fieldErrors,
    validateField,
    handleSave,
    formatRangeInSelectedUnit
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

  const isReadOnly = appointment.status === 'COMPLETED';

  return (
    <MainLayout title="Capture Vitals" hideTitle>
      <div className="p-4 sm:p-8 max-w-[1200px] mx-auto w-full -m-4 sm:-m-8 bg-[#f9f9ff] min-h-screen font-inter pb-32">
        
        <PageHeading 
          title="Clinical Vitals Intake" 
          description="Capture primary physiological measurements to establish the patient's current health baseline."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Patient Profile Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="overflow-hidden">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-3xl sm:text-4xl uppercase mb-4 sm:mb-6 border-4 border-white shadow-sm">
                  {patient?.fullName.split(' ').map(n => n[0]).join('') || 'P'}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1">{patient?.fullName || appointment.patientName}</h3>
                <Badge variant="blue" className="mb-6 sm:mb-8 text-[10px] sm:text-xs">{patient?.gender || '--'} • {patientAge} Years</Badge>
                
                <div className="w-full space-y-3 sm:space-y-4 pt-6 border-t border-slate-50">
                   <div className="flex items-center gap-3 sm:gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="material-symbols-outlined text-orange-600 text-lg sm:text-xl shrink-0">fingerprint</span>
                      <div className="text-left min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Patient Code</p>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm leading-none truncate">{patient?.patientCode || 'N/A'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 sm:gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="material-symbols-outlined text-orange-600 text-lg sm:text-xl shrink-0">medical_services</span>
                      <div className="text-left min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Attending Physician</p>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm leading-none truncate">Dr. {appointment.doctorName}</p>
                      </div>
                   </div>
                </div>
              </div>
            </Card>

            <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden hidden sm:block">
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
            <Card title="Clinical Measurements" icon="monitoring" className="p-4 sm:p-8">
              <form className="space-y-6 sm:space-y-8" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                
                {/* Blood Pressure Row */}
                <FormField 
                  label="Arterial Blood Pressure (mmHg)" 
                  error={fieldErrors.systolic || fieldErrors.diastolic}
                  className="mb-6"
                >
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <input 
                          type="text"
                          inputMode="numeric"
                          placeholder="Systolic"
                          className={`w-full p-3 sm:p-4 bg-slate-50 border rounded-xl font-black text-lg sm:text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.systolic ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100'}`}
                          value={systolic}
                          onChange={(e) => { setSystolic(e.target.value); validateField('systolic', e.target.value); }}
                        />
                        <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[8px] sm:text-[10px] font-black text-slate-300 uppercase">SYS</span>
                      </div>
                    </div>
                    
                    <span className="text-2xl sm:text-4xl font-black text-slate-200">/</span>
                    
                    <div className="flex-1">
                      <div className="relative">
                        <input 
                          type="text"
                          inputMode="numeric"
                          placeholder="Diastolic"
                          className={`w-full p-3 sm:p-4 bg-slate-50 border rounded-xl font-black text-lg sm:text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.diastolic ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100'}`}
                          value={diastolic}
                          onChange={(e) => { setDiastolic(e.target.value); validateField('diastolic', e.target.value); }}
                        />
                        <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[8px] sm:text-[10px] font-black text-slate-300 uppercase">DIA</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {fieldErrors.systolic && <p className="text-[11px] text-red-600 font-bold uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> Systolic: {fieldErrors.systolic}</p>}
                    {fieldErrors.diastolic && <p className="text-[11px] text-red-600 font-bold uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> Diastolic: {fieldErrors.diastolic}</p>}
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      Normal Range: {formatRangeInSelectedUnit('SYSTOLIC_BP')} / {formatRangeInSelectedUnit('DIASTOLIC_BP')}
                    </p>
                  </div>
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  
                  {/* Heart Rate */}
                  <FormField 
                    label="Heart Rate (BPM)" 
                    className="mb-0"
                  >
                    <div className="relative">
                      <input 
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 72"
                        disabled={isReadOnly}
                        className={`w-full p-3 sm:p-4 bg-slate-50 border rounded-xl font-black text-lg sm:text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.heartRate ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={heartRate}
                        onChange={(e) => { setHeartRate(e.target.value); validateField('heartRate', e.target.value); }}
                      />
                      <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-orange-600 text-xl sm:text-2xl">favorite</span>
                    </div>
                    {fieldErrors.heartRate && <p className="text-[11px] text-red-600 font-bold mt-1 uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.heartRate}</p>}
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      Allowed Range: {formatRangeInSelectedUnit('HEART_RATE')}
                    </p>
                  </FormField>

                  {/* Oxygen Level */}
                  <FormField 
                    label="Oxygen Level (SpO2 %)" 
                    className="mb-0"
                  >
                    <div className="relative">
                      <input 
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 98"
                        className={`w-full p-3 sm:p-4 bg-slate-50 border rounded-xl font-black text-lg sm:text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.oxygenLevel ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100'}`}
                        value={oxygenLevel}
                        onChange={(e) => { setOxygenLevel(e.target.value); validateField('oxygenLevel', e.target.value); }}
                      />
                      <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-blue-600 text-xl sm:text-2xl">pulse_alert</span>
                    </div>
                    {fieldErrors.oxygenLevel && <p className="text-[11px] text-red-600 font-bold mt-1 uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.oxygenLevel}</p>}
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      Allowed Range: {formatRangeInSelectedUnit('OXYGEN_LEVEL')}
                    </p>
                  </FormField>

                  {/* Body Temperature */}
                  <FormField
                    label="Body Temperature"
                    className="mb-0"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Unit System</span>
                        <select 
                          className="text-[9px] sm:text-[10px] font-black bg-slate-100 border-none rounded px-2 py-1 uppercase tracking-tight outline-none"
                          value={displayTempUnit}
                          onChange={(e) => setDisplayTempUnit(e.target.value as any)}
                        >
                          <option value="C">°C</option>
                          <option value="F">°F</option>
                        </select>
                      </div>
                      <div className="relative">
                        <input 
                          type="text"
                          inputMode="decimal"
                          placeholder={displayTempUnit === 'C' ? 'e.g. 36.6' : 'e.g. 98.6'}
                          className={`w-full p-3 sm:p-4 bg-slate-50 border rounded-xl font-black text-lg sm:text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.temperature ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100'}`}
                          value={temperature}
                          onChange={(e) => { setTemperature(e.target.value); validateField('temperature', e.target.value); }}
                        />
                        <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm sm:text-base">{displayTempUnit === 'C' ? '°C' : '°F'}</span>
                      </div>
                    </div>
                    {fieldErrors.temperature && <p className="text-[11px] text-red-600 font-bold mt-1 uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.temperature}</p>}
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      Allowed Range: {formatRangeInSelectedUnit('BODY_TEMPERATURE')}
                    </p>
                  </FormField>

                  {/* Weight */}
                  <FormField
                    label="Patient Weight"
                    className="mb-0"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Unit System</span>
                        <select 
                          className="text-[9px] sm:text-[10px] font-black bg-slate-100 border-none rounded px-2 py-1 uppercase tracking-tight outline-none"
                          value={displayWeightUnit}
                          onChange={(e) => setDisplayWeightUnit(e.target.value as any)}
                        >
                          <option value="KG">KG</option>
                          <option value="LB">LB</option>
                        </select>
                      </div>
                      <div className="relative">
                        <input 
                          type="text"
                          inputMode="decimal"
                          placeholder={displayWeightUnit === 'KG' ? 'e.g. 75.0' : 'e.g. 165.3'}
                          className={`w-full p-3 sm:p-4 bg-slate-50 border rounded-xl font-black text-lg sm:text-xl text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.weight ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100'}`}
                          value={weight}
                          onChange={(e) => { setWeight(e.target.value); validateField('weight', e.target.value); }}
                        />
                        <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold lowercase text-sm sm:text-base">{displayWeightUnit}</span>
                      </div>
                    </div>
                    {fieldErrors.weight && <p className="text-[11px] text-red-600 font-bold mt-1 uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.weight}</p>}
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      Allowed Range: {formatRangeInSelectedUnit('WEIGHT')}
                    </p>
                  </FormField>

                </div>

                {/* Chief Complaints */}
                <div className="pt-4 border-t border-slate-50">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Patient Symptoms & Complaints</label>
                   <textarea 
                    className="w-full p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none resize-none text-sm sm:text-base"
                    placeholder="Document current symptoms, duration, and patient's primary concern..."
                    rows={4}
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                   />
                </div>

              </form>

            </Card>
            <div className="flex justify-center sm:justify-end pb-8">
              <Button
                  icon="check_circle"
                  size="xl"
                  isLoading={saving}
                  onClick={() => handleSave()}
                  className="w-full sm:w-auto px-10 text-sm font-black uppercase tracking-widest"
              >
                {saving ? 'Saving...' : 'Confirm & Submit'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
