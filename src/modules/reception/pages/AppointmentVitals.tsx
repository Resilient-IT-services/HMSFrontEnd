'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useReceptionVitals } from '@/modules/reception/hooks/useReceptionVitals';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { PageHeading } from '@/components/ui/PageHeading';

export const AppointmentVitals = () => {
  const {
    appointment,
    patient,
    patientAge,
    systolic, setSystolic,
    diastolic, setDiastolic,
    heartRate, setHeartRate,
    temperature, setTemperature,
    displayTempUnit, setDisplayTempUnit,
    weight, setWeight,
    oxygenLevel, setOxygenLevel,
    complaints, setComplaints,
    fieldErrors,
    saving,
    handleSave,
    validateField,
    vitalRanges // Superadmin panel boundaries pull karne ke liye
  } = useReceptionVitals();

  if (!appointment) {
    return (
        <MainLayout title="Error">
          <div className="p-10 text-center">
            <Badge variant="red" size="md" className="mb-2">Appointment Not Found</Badge>
            <p className="text-slate-900 font-black text-lg mb-4">Unable to locate the record.</p>
          </div>
        </MainLayout>
    );
  }

  const isReadOnly = ['CONSULTATION_STARTED', 'PRESCRIPTION_FINALIZED', 'COMPLETED', 'CANCELLED'].includes(appointment.status);

  // Superadmin Panel Boundary Mapping with Fallbacks
  const tempConfig = {
    F: { 
      min: vitalRanges.BODY_TEMPERATURE?.minValue || 95, 
      max: vitalRanges.BODY_TEMPERATURE?.maxValue || 108 
    },
    C: { 
      min: 35, 
      max: 42.2 
    }
  };

  // Real-time Validation Trigger on Blur
  const handleFieldBlur = (fieldKey: string, value: string) => {
    validateField(fieldKey, value);
  };

  // Unit Switcher: Toggles Unit and instantly re-validates the existing text
  const handleUnitToggle = (unit: 'F' | 'C') => {
    setDisplayTempUnit(unit);
    if (temperature) {
      // Small timeout taaki state properly update ho sake backend trigger se pehle
      setTimeout(() => {
        validateField('temperature', temperature);
      }, 10);
    }
  };

  const handleInterceptedSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly) return;
    void handleSave();
  };

  return (
      <MainLayout title="Capture Vitals" hideTitle>
        <PageHeading
            title={isReadOnly ? "View Recorded Vitals" : "Clinical Vitals Intake"}
            description={isReadOnly ? "Viewing finalized physiological measurements for this visit." : "Capture primary physiological measurements to establish the patient's current health baseline."}
        />

        {/* MASTER GRID WITH TIGHT SLATE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 items-start">

          {/* --- LEFT PANEL: COMPACT PROFILE & COMPLAINTS --- */}
          <div className="lg:col-span-1 flex flex-col gap-3">

            {/* Patient Card Layer */}
            <Card title="Patient Profile" className="p-3 shadow-sm border border-slate-200/60">
              <div className="space-y-3">
                <div className="border-b-2 border-slate-100 pb-2.5">
                  <h3 className="text-xl font-black text-orange-600 tracking-tight uppercase truncate drop-shadow-sm">
                    {patient?.fullName || appointment.patientName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge variant="blue" className="text-[10px] font-black px-2 py-0.5">{patientAge} Yrs</Badge>
                    <Badge variant="slate" className="text-[10px] font-black px-2 py-0.5">{patient?.gender || 'N/A'}</Badge>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-600">
                  <div className="flex items-center justify-between w-full border-b border-slate-50 pb-1.5">
                    <div className="flex items-center gap-2 uppercase tracking-wider text-slate-400 text-[10px]">
                      <span className="material-symbols-outlined text-base">id_card</span>
                      <span>Patient ID</span>
                    </div>
                    <span className="text-slate-900 font-black font-mono text-sm">{patient?.patientCode || '--'}</span>
                  </div>

                  <div className="flex items-center justify-between w-full border-b border-slate-50 pb-1.5">
                    <div className="flex items-center gap-2 uppercase tracking-wider text-slate-400 text-[10px]">
                      <span className="material-symbols-outlined text-base">confirmation_number</span>
                      <span>Visit Token</span>
                    </div>
                    <span className="text-slate-900 font-black font-mono text-sm">{appointment.tokenNumber || '--'}</span>
                  </div>

                  <div className="flex items-center justify-between w-full pb-0.5">
                    <div className="flex items-center gap-2 uppercase tracking-wider text-slate-400 text-[10px]">
                      <span className="material-symbols-outlined text-base">medical_services</span>
                      <span>Assigned Doctor</span>
                    </div>
                    <span className="text-slate-900 font-black text-sm">Dr. {appointment.doctorName}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Complaints Card Layer */}
            <Card title="Chief Complaints" className="p-3 shadow-sm border border-slate-200/60">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <span className="material-symbols-outlined text-base font-bold">description</span>
                  </div>
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Symptoms Log</span>
                </div>

                <textarea
                    rows={3}
                    disabled={isReadOnly}
                    placeholder="Document patient's primary symptoms & complaints here..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none resize-none shadow-inner"
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                />
              </div>
            </Card>
          </div>

          {/* --- RIGHT PANEL: CLINICAL MEASUREMENTS FORM --- */}
          <div className="lg:col-span-2">
            <Card title="Clinical Measurements Baseline" className="p-4 shadow-md border border-slate-200/80">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <div className="w-6 h-6 rounded-md bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-100">
                  <span className="material-symbols-outlined text-base font-black">monitoring</span>
                </div>
                <span className="font-bold text-slate-700 text-sm">Physiological Metrics Intake</span>
              </div>

              <form className="space-y-4" onSubmit={handleInterceptedSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3.5">

                  {/* 1. Blood Pressure Input Block */}
                  <FormField
                      label={
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                          <div className="w-5 h-5 rounded-full bg-orange-50/70 border border-orange-100/50 flex items-center justify-center text-orange-700 shrink-0">
                            <span className="material-symbols-outlined text-[13px] font-black">cardiology</span>
                          </div>
                          <span>Blood Pressure (mmHg)</span>
                        </div>
                      }
                      error={fieldErrors.systolic || fieldErrors.diastolic}
                  >
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative flex-1">
                        <input
                            type="text" placeholder="Sys" disabled={isReadOnly} maxLength={3}
                            className={`w-full p-3 bg-slate-50 border rounded-xl font-black text-sm text-center focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm ${fieldErrors.systolic ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 text-slate-800'}`}
                            value={systolic}
                            onChange={(e) => setSystolic(e.target.value.replaceAll(/\D/g, ''))}
                            onBlur={(e) => handleFieldBlur('systolic', e.target.value)}
                        />
                      </div>
                      <span className="text-slate-300 font-black text-base">/</span>
                      <div className="relative flex-1">
                        <input
                            type="text" placeholder="Dia" disabled={isReadOnly} maxLength={3}
                            className={`w-full p-3 bg-slate-50 border rounded-xl font-black text-sm text-center focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm ${fieldErrors.diastolic ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 text-slate-800'}`}
                            value={diastolic}
                            onChange={(e) => setDiastolic(e.target.value.replaceAll(/\D/g, ''))}
                            onBlur={(e) => handleFieldBlur('diastolic', e.target.value)}
                        />
                      </div>
                    </div>
                  </FormField>

                  {/* 2. Heart Rate Input Block */}
                  <FormField
                      label={
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                          <div className="w-5 h-5 rounded-full bg-orange-50/70 border border-orange-100/50 flex items-center justify-center text-orange-700 shrink-0">
                            <span className="material-symbols-outlined text-[13px] font-black">favorite</span>
                          </div>
                          <span>Heart Rate / Pulse (BPM)</span>
                        </div>
                      }
                      error={fieldErrors.heartRate}
                  >
                    <div className="relative mt-1">
                      <input
                          type="text" placeholder="e.g. 72" disabled={isReadOnly} maxLength={3}
                          className={`w-full p-3 bg-slate-50 border rounded-xl font-black text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm ${fieldErrors.heartRate ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 text-slate-800'}`}
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value.replaceAll(/\D/g, ''))}
                          onBlur={(e) => handleFieldBlur('heartRate', e.target.value)}
                      />
                    </div>
                  </FormField>

                  {/* 3. Temperature Input Block with SWITCH TOGGLE CONTROLS & DYNAMIC VALIDATION */}
                  <FormField
                      label={
                        <div className="flex justify-between items-center w-full font-bold text-slate-700 text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-orange-50/70 border border-orange-100/50 flex items-center justify-center text-orange-700 shrink-0">
                              <span className="material-symbols-outlined text-[13px] font-black">device_thermostat</span>
                            </div>
                            <span>Body Temperature</span>
                          </div>

                          <div className="flex border border-slate-300/80 rounded-md overflow-hidden bg-slate-100 p-0.5 scale-110 origin-right shrink-0 shadow-sm">
                            <button
                                type="button" disabled={isReadOnly}
                                onClick={() => handleUnitToggle('F')}
                                className={`px-3 py-0.5 text-[11px] font-extrabold rounded transition-all uppercase tracking-wide ${displayTempUnit === 'F' ? 'bg-orange-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >°F</button>
                            <button
                                type="button" disabled={isReadOnly}
                                onClick={() => handleUnitToggle('C')}
                                className={`px-3 py-0.5 text-[11px] font-extrabold rounded transition-all uppercase tracking-wide ${displayTempUnit === 'C' ? 'bg-orange-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >°C</button>
                          </div>
                        </div>
                      }
                      /* GHOST ERROR FIXED: error block tabhi generate hoga jab fieldErrors exist karega */
                      error={
                        fieldErrors.temperature
                            ? (fieldErrors.temperature.toLowerCase().includes('required')
                                ? 'Temperature is required'
                                : `Temperature must be between ${tempConfig[displayTempUnit].min} and ${tempConfig[displayTempUnit].max} °${displayTempUnit}`)
                            : undefined
                      }
                  >
                    <div className="relative mt-1">
                      <input
                          type="text" placeholder={displayTempUnit === 'F' ? 'e.g. 98.6' : 'e.g. 37.0'} disabled={isReadOnly}
                          className={`w-full p-3 bg-slate-50 border rounded-xl font-black text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm ${fieldErrors.temperature ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 text-slate-800'}`}
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value.replaceAll(/[^0-9.]/g, ''))}
                          onBlur={(e) => handleFieldBlur('temperature', e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">°{displayTempUnit}</span>
                    </div>
                  </FormField>

                  {/* 4. Oxygen Level SpO2 Input Block */}
                  <FormField
                      label={
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                          <div className="w-5 h-5 rounded-full bg-orange-50/70 border border-orange-100/50 flex items-center justify-center text-orange-700 shrink-0">
                            <span className="material-symbols-outlined text-[13px] font-black">airwave</span>
                          </div>
                          <span>Oxygen Level SpO2 (%)</span>
                        </div>
                      }
                      error={fieldErrors.oxygenLevel}
                  >
                    <div className="relative mt-1">
                      <input
                          type="text" placeholder="e.g. 98" disabled={isReadOnly} maxLength={3}
                          className={`w-full p-3 bg-slate-50 border rounded-xl font-black text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm ${fieldErrors.oxygenLevel ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 text-slate-800'}`}
                          value={oxygenLevel}
                          onChange={(e) => setOxygenLevel(e.target.value.replaceAll(/\D/g, ''))}
                          onBlur={(e) => handleFieldBlur('oxygenLevel', e.target.value)}
                      />
                    </div>
                  </FormField>

                  {/* 5. Weight Input Block */}
                  <FormField
                      label={
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                          <div className="w-5 h-5 rounded-full bg-orange-50/70 border border-orange-100/50 flex items-center justify-center text-orange-700 shrink-0">
                            <span className="material-symbols-outlined text-[13px] font-black">weight</span>
                          </div>
                          <span>Body Weight (kg)</span>
                        </div>
                      }
                      error={fieldErrors.weight}
                  >
                    <div className="relative mt-1">
                      <input
                          type="text" placeholder="e.g. 70" disabled={isReadOnly} maxLength={5}
                          className={`w-full p-3 bg-slate-50 border rounded-xl font-black text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm ${fieldErrors.weight ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 text-slate-800'}`}
                          value={weight}
                          onChange={(e) => setWeight(e.target.value.replaceAll(/[^0-9.]/g, ''))}
                          onBlur={(e) => handleFieldBlur('weight', e.target.value)}
                      />
                    </div>
                  </FormField>

                </div>

                {!isReadOnly && (
                    <div className="pt-3.5 border-t border-slate-100 flex justify-end">
                      <Button
                          type="submit" disabled={saving}
                          className="w-full sm:w-auto px-10 py-2.5 bg-orange-700 hover:bg-orange-800 shadow-md text-xs font-black uppercase tracking-wider transition-all duration-150"
                          icon={saving ? 'sync' : 'check_circle'}
                      >
                        {saving ? 'Processing Log...' : 'Submit Clinical Vitals'}
                      </Button>
                    </div>
                )}
              </form>
            </Card>
          </div>

        </div>
      </MainLayout>
  );
};