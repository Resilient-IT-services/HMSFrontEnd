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
          <div className="p-6 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Initializing...</p>
          </div>
        </MainLayout>
    );
  }

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

  return (
      <MainLayout title="Capture Vitals" hideTitle>
        <div className="w-full bg-[#f9f9ff] font-inter p-3 sm:p-4 rounded-2xl border border-slate-100">

          <div className="mb-3">
            <PageHeading
                title={isReadOnly ? "View Clinical Vitals" : "Clinical Vitals Intake"}
                description={isReadOnly ? "View recorded physiological measurements." : "Capture primary physiological measurements to establish the patient's current health baseline."}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start w-full">

            {/* Patient Profile & Complaints Sidebar */}
            <div className="lg:col-span-1 space-y-3 w-full">
              {/* Profile Card */}
              <Card className="overflow-hidden p-3 w-full">
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 tracking-tight truncate w-full">
                    {patient?.fullName || appointment.patientName}
                  </h3>
                  <Badge variant="blue" className="mb-2 text-[10px] px-2 py-0.5 font-bold">
                    {patient?.gender || '--'} • {patientAge} Years
                  </Badge>

                  <div className="w-full space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-orange-600 text-base shrink-0">fingerprint</span>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Patient Code</p>
                        <p className="font-bold text-slate-900 text-xs leading-none truncate">{patient?.patientCode || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-orange-600 text-base shrink-0">medical_services</span>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Attending Physician</p>
                        <p className="font-bold text-slate-900 text-xs leading-none truncate">Dr. {appointment.doctorName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chief Complaints Card */}
              <Card title="Chief Complaints" icon="description" className="p-3 w-full">
                <div className="mt-1">
                 <textarea
                     className={`w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 hover:border-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none resize-none text-xs ${isReadOnly ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' : ''}`}
                     placeholder="Document current symptoms, duration..."
                     rows={3}
                     value={complaints}
                     disabled={isReadOnly}
                     onChange={(e) => setComplaints(e.target.value)}
                 />
                </div>
              </Card>

              {/* Clinical Protocol */}
              <div className="bg-slate-900 p-3 rounded-xl text-white shadow-md relative overflow-hidden hidden sm:block w-full">
                <h4 className="font-bold text-[9px] mb-1 flex items-center gap-1 uppercase tracking-widest opacity-60">
                  Clinical Protocol
                </h4>
                <p className="text-[11px] font-medium leading-normal italic opacity-90">
                  "Ensure the patient has rested for at least 5 minutes before recording blood pressure."
                </p>
              </div>
            </div>

            {/* Vitals Entry Form */}
            <div className="lg:col-span-3 space-y-3 w-full">
              <Card title="Clinical Measurements" icon="monitoring" className="p-4 w-full">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

                  {/* Blood Pressure Row */}
                  <FormField
                      label="Arterial Blood Pressure (mmHg)"
                      error={fieldErrors.systolic || fieldErrors.diastolic}
                      className="mb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="relative">
                          <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Systolic"
                              disabled={isReadOnly}
                              className={`w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-sm sm:text-base text-slate-900 hover:border-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.systolic ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-600/10' : ''} ${isReadOnly ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' : ''}`}
                              value={systolic}
                              onChange={(e) => { setSystolic(e.target.value); validateField('systolic', e.target.value); }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-300 uppercase">SYS</span>
                        </div>
                      </div>

                      <span className="text-xl font-black text-slate-200">/</span>

                      <div className="flex-1">
                        <div className="relative">
                          <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Diastolic"
                              disabled={isReadOnly}
                              className={`w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-sm sm:text-base text-slate-900 hover:border-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.diastolic ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-600/10' : ''} ${isReadOnly ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' : ''}`}
                              value={diastolic}
                              onChange={(e) => { setDiastolic(e.target.value); validateField('diastolic', e.target.value); }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-300 uppercase">DIA</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {fieldErrors.systolic && <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> Systolic: {fieldErrors.systolic}</p>}
                      {fieldErrors.diastolic && <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> Diastolic: {fieldErrors.diastolic}</p>}
                      <p className="text-[8px] text-slate-400 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">info</span>
                        Normal: {formatRangeInSelectedUnit('SYSTOLIC_BP')} / {formatRangeInSelectedUnit('DIASTOLIC_BP')}
                      </p>
                    </div>
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Heart Rate */}
                    <FormField label="Heart Rate (BPM)" className="mb-0">
                      <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 72"
                            disabled={isReadOnly}
                            className={`w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-sm sm:text-base text-slate-900 hover:border-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.heartRate ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-600/10' : ''} ${isReadOnly ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' : ''}`}
                            value={heartRate}
                            onChange={(e) => { setHeartRate(e.target.value); validateField('heartRate', e.target.value); }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-orange-600 text-base">favorite</span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {fieldErrors.heartRate && <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.heartRate}</p>}
                        <p className="text-[8px] text-slate-400 font-bold flex items-center gap-1">
                          Range: {formatRangeInSelectedUnit('HEART_RATE')}
                        </p>
                      </div>
                    </FormField>

                    {/* Oxygen Level */}
                    <FormField label="Oxygen Level (SpO2 %)" className="mb-0">
                      <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 98"
                            disabled={isReadOnly}
                            className={`w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-sm sm:text-base text-slate-900 hover:border-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.oxygenLevel ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-600/10' : ''} ${isReadOnly ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' : ''}`}
                            value={oxygenLevel}
                            onChange={(e) => { setOxygenLevel(e.target.value); validateField('oxygenLevel', e.target.value); }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-blue-600 text-base">pulse_alert</span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {fieldErrors.oxygenLevel && <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.oxygenLevel}</p>}
                        <p className="text-[8px] text-slate-400 font-bold flex items-center gap-1">
                          Range: {formatRangeInSelectedUnit('OXYGEN_LEVEL')}
                        </p>
                      </div>
                    </FormField>

                    {/* Body Temperature */}
                    <FormField label="Body Temperature" className="mb-0">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[7px] font-black text-slate-400 uppercase">Unit System</span>
                          <select
                              className="text-[8px] font-black bg-slate-100 border-none rounded px-1 py-0.5 uppercase outline-none"
                              value={displayTempUnit}
                              disabled={isReadOnly}
                              onChange={(e) => { setDisplayTempUnit(e.target.value as any); validateField('temperature', temperature); }}
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
                              disabled={isReadOnly}
                              className={`w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-sm sm:text-base text-slate-900 hover:border-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.temperature ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-600/10' : ''} ${isReadOnly ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' : ''}`}
                              value={temperature}
                              onChange={(e) => { setTemperature(e.target.value); validateField('temperature', e.target.value); }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{displayTempUnit === 'C' ? '°C' : '°F'}</span>
                        </div>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {fieldErrors.temperature && (
                            <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">error</span>
                              {displayTempUnit === 'C' ? 'Temperature must be between 35.0 and 42.2 °C' : 'Temperature must be between 95.0 and 108.0 °F'}
                            </p>
                        )}
                        <p className="text-[8px] text-slate-400 font-bold flex items-center gap-1">
                          Range: {formatRangeInSelectedUnit('BODY_TEMPERATURE')}
                        </p>
                      </div>
                    </FormField>

                    {/* Weight */}
                    <FormField label="Patient Weight" className="mb-0">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[7px] font-black text-slate-400 uppercase">Unit System</span>
                          <select
                              className="text-[8px] font-black bg-slate-100 border-none rounded px-1 py-0.5 uppercase outline-none"
                              value={displayWeightUnit}
                              disabled={isReadOnly}
                              onChange={(e) => { setDisplayWeightUnit(e.target.value as any); validateField('weight', weight); }}
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
                              disabled={isReadOnly}
                              className={`w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-sm sm:text-base text-slate-900 hover:border-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-600/10 transition-all outline-none ${fieldErrors.weight ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-600/10' : ''} ${isReadOnly ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' : ''}`}
                              value={weight}
                              onChange={(e) => { setWeight(e.target.value); validateField('weight', e.target.value); }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold lowercase text-xs">{displayWeightUnit}</span>
                        </div>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {fieldErrors.weight && (
                            <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">error</span>
                              {displayWeightUnit === 'KG' ? 'Weight must be between 40.0 and 120.0 kg' : 'Weight must be between 88.1 and 264.5 lb'}
                            </p>
                        )}
                        <p className="text-[8px] text-slate-400 font-bold flex items-center gap-1">
                          Range: {formatRangeInSelectedUnit('WEIGHT')}
                        </p>
                      </div>
                    </FormField>

                  </div>

                </form>

              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end pt-1">
                {isReadOnly ? (
                    <Button
                        variant="secondary"
                        icon="close"
                        size="md"
                        onClick={() => router.push('/reception/appointments')}
                        className="w-full sm:w-auto px-8 text-xs font-black uppercase tracking-widest"
                    >
                      Close
                    </Button>
                ) : (
                    <Button
                        icon="check_circle"
                        size="md"
                        isLoading={saving}
                        onClick={() => handleSave()}
                        className="w-full sm:w-auto px-10 text-xs font-black uppercase tracking-widest h-10 flex items-center justify-center"
                    >
                      {saving ? 'Saving...' : 'Confirm & Submit'}
                    </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
  );
};