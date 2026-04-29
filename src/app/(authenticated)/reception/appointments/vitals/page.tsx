'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { AppointmentResponse, PatientResponse, VitalsDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';

import { adminService, VitalSetting } from '@/services/adminService';

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
  const [tempUnit, setTempUnit] = useState<'CELSIUS' | 'FAHRENHEIT'>('CELSIUS');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>('KG');
  const [oxygenLevel, setOxygenLevel] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState(''); 
  const [complaints, setComplaints] = useState('');

  const [vitalSettings, setVitalSettings] = useState<VitalSetting[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Use skipToast: true to avoid global error if receptionist isn't authorized for admin endpoints
        const res = await adminService.listVitalSettings({ skipToast: true });
        if (res.success && res.data) {
          setVitalSettings(res.data);
          
          // Set default units from config if available
          const tempConfig = (res.data as VitalSetting[]).find((s: VitalSetting) => s.vitalName.toUpperCase().includes('TEMPERATURE'));
          if (tempConfig && tempConfig.unit) setTempUnit(tempConfig.unit as any);
          
          const weightConfig = (res.data as VitalSetting[]).find((s: VitalSetting) => s.vitalName.toUpperCase().includes('WEIGHT'));
          if (weightConfig && weightConfig.unit) setWeightUnit(weightConfig.unit as any);
        }
      } catch (error: any) {
        // Only log if it's not a 403 (unauthorized) which is expected for non-admin roles
        if (error.response?.status !== 403) {
          console.error('Failed to load vitals config', error);
        } else {
          console.log('Vitals configuration access restricted (403), using client defaults.');
        }
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      try {
        const appRes = await appointmentService.get(appointmentId);
        const appData = appRes.data;
        if (appRes.success && appData) {
          setAppointment(appData);
          setComplaints(appData.notes || '');
          
          if (appData.vitals) {
            setSystolic(appData.vitals.systolic?.toString() || appData.vitals.bloodPressure?.split('/')[0] || '');
            setDiastolic(appData.vitals.diastolic?.toString() || appData.vitals.bloodPressure?.split('/')[1] || '');
            setHeartRate(appData.vitals.heartRate?.toString() || '');
            setTemperature(appData.vitals.temperature?.toString() || '');
            
            // Fix TS2367 by casting to string for comparison with legacy/alternate symbols
            const tUnit = (appData.vitals.temperatureUnit as string);
            setTempUnit(tUnit === '°C' ? 'CELSIUS' : (tUnit === '°F' ? 'FAHRENHEIT' : (appData.vitals.temperatureUnit || 'CELSIUS')));
            
            setWeight(appData.vitals.weight?.toString() || '');
            const wUnit = (appData.vitals.weightUnit as string);
            setWeightUnit(wUnit === 'kg' ? 'KG' : (wUnit === 'lb' ? 'LB' : (appData.vitals.weightUnit || 'KG')));
            
            setOxygenLevel(appData.vitals.oxygenLevel?.toString() || '');
            setRespiratoryRate(appData.vitals.respiratoryRate?.toString() || '');
          }

          const patRes = await patientService.get(appData.patientId);
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

  const validateVitals = () => {
    const errors: Record<string, string> = {};
    
    const validateField = (value: string, configName: string, fieldName: string, isRequired: boolean = true) => {
      if (!value) {
        if (isRequired) errors[fieldName] = 'Required';
        return;
      }

      const numValue = Number.parseFloat(value);
      if (Number.isNaN(numValue)) {
        errors[fieldName] = 'Invalid number';
        return;
      }

      const setting = vitalSettings.find(s => 
        s.vitalName.toUpperCase().includes(configName.toUpperCase()) || 
        configName.toUpperCase().includes(s.vitalName.toUpperCase())
      );
      if (setting) {
        if (numValue < (setting.minValue ?? 0) || numValue > (setting.maxValue ?? 999)) {
          errors[fieldName] = `Must be between ${setting.minValue} and ${setting.maxValue} ${setting.unit || ''}`;
        }
      } else {
        // Log it but don't necessarily block if it's a known standard vital
        console.warn(`No configuration found for vital: ${configName}`);
      }
    };

    validateField(temperature, 'TEMPERATURE', 'temperature');
    validateField(weight, 'WEIGHT', 'weight');
    validateField(oxygenLevel, 'OXYGEN', 'oxygenLevel');
    validateField(systolic, 'SYSTOLIC', 'systolic');
    validateField(diastolic, 'DIASTOLIC', 'diastolic');
    validateField(heartRate, 'HEART RATE', 'heartRate');
    validateField(respiratoryRate, 'RESPIRATORY', 'respiratoryRate', false);

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const renderFieldError = (field: string) => {
    if (fieldErrors[field]) {
      return <p className="text-error text-[10px] font-bold mt-1 uppercase tracking-tight animate-in fade-in slide-in-from-top-1">{fieldErrors[field]}</p>;
    }
    return null;
  };

  const handleSave = async (isDraft: boolean = false) => {
    if (!appointment) return;
    if (!validateVitals()) {
      triggerGlobalToast('Please correct the errors in the form', 'error');
      return;
    }

    setSaving(true);
    try {
      // Construct sanitized payload matching server VitalsDTO exactly
      const vitals: VitalsDTO = {
        bloodPressure: `${systolic}/${diastolic}`,
        systolic: Number.parseInt(systolic, 10) || 0,
        diastolic: Number.parseInt(diastolic, 10) || 0,
        heartRate: Number.parseInt(heartRate, 10) || 0,
        temperature: Number.parseFloat(temperature) || 0,
        temperatureUnit: tempUnit,
        weight: Number.parseFloat(weight) || 0,
        weightUnit: weightUnit,
        oxygenLevel: Number.parseFloat(oxygenLevel) || 0,
        respiratoryRate: Number.parseFloat(respiratoryRate) || 0,
      };

      // 4. Try using the general update method instead of patchVitals
      // Include mandatory fields required by the PUT endpoint
      const res = await appointmentService.update(appointment.id, { 
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentTime: appointment.appointmentTime,
        vitals,
        notes: complaints,
        chiefComplaints: complaints
      });

      if (res.success) {
        triggerGlobalToast(isDraft ? 'Draft saved successfully' : 'Vitals submitted successfully', 'success');
        router.push('/reception/appointments');
      }
    } catch (error) {
      console.error('Failed to save vitals', error);
      // The error message from Axios interceptor will already show a toast
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
                    <label className="block text-label-md font-bold text-on-surface mb-2">
                      Blood Pressure 
                      {vitalSettings.find(s => s.vitalName.toUpperCase().includes('SYSTOLIC')) && (
                        <span className="text-[10px] text-slate-400 ml-2 normal-case font-normal">
                          (Sys: {vitalSettings.find(s => s.vitalName.toUpperCase().includes('SYSTOLIC'))?.minValue}-{vitalSettings.find(s => s.vitalName.toUpperCase().includes('SYSTOLIC'))?.maxValue}, 
                           Dia: {vitalSettings.find(s => s.vitalName.toUpperCase().includes('DIASTOLIC'))?.minValue}-{vitalSettings.find(s => s.vitalName.toUpperCase().includes('DIASTOLIC'))?.maxValue})
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input 
                          className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container transition-all ${fieldErrors.systolic ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'}`}
                          placeholder="Systolic" 
                          type="text"
                          value={systolic}
                          onChange={(e) => {
                            setSystolic(e.target.value);
                            if (fieldErrors.systolic) setFieldErrors(prev => ({ ...prev, systolic: '' }));
                          }}
                        />
                        {renderFieldError('systolic')}
                      </div>
                      <span className="text-headline-md text-gray-300">/</span>
                      <div className="relative flex-1">
                        <input 
                          className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container transition-all ${fieldErrors.diastolic ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'}`}
                          placeholder="Diastolic" 
                          type="text"
                          value={diastolic}
                          onChange={(e) => {
                            setDiastolic(e.target.value);
                            if (fieldErrors.diastolic) setFieldErrors(prev => ({ ...prev, diastolic: '' }));
                          }}
                        />
                        {renderFieldError('diastolic')}
                      </div>
                    </div>
                  </div>
                  {/* Heart Rate */}
                  <div className="col-span-1">
                    <label className="block text-label-md font-bold text-on-surface mb-2">
                      Heart Rate
                      {vitalSettings.find(s => s.vitalName.toUpperCase().includes('HEART RATE')) && (
                        <span className="text-[10px] text-slate-400 ml-2 normal-case font-normal">
                          ({vitalSettings.find(s => s.vitalName.toUpperCase().includes('HEART RATE'))?.minValue}-{vitalSettings.find(s => s.vitalName.toUpperCase().includes('HEART RATE'))?.maxValue} BPM)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input 
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container transition-all ${fieldErrors.heartRate ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'}`}
                        placeholder="e.g. 72" 
                        type="text"
                        value={heartRate}
                        onChange={(e) => {
                          setHeartRate(e.target.value);
                          if (fieldErrors.heartRate) setFieldErrors(prev => ({ ...prev, heartRate: '' }));
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">BPM</span>
                    </div>
                    {renderFieldError('heartRate')}
                  </div>
                  {/* Oxygen Level */}
                  <div className="col-span-1">
                    <label className="block text-label-md font-bold text-on-surface mb-2">
                      Oxygen Level (SpO2)
                      {vitalSettings.find(s => s.vitalName.toUpperCase().includes('OXYGEN')) && (
                        <span className="text-[10px] text-slate-400 ml-2 normal-case font-normal">
                          ({vitalSettings.find(s => s.vitalName.toUpperCase().includes('OXYGEN'))?.minValue}-{vitalSettings.find(s => s.vitalName.toUpperCase().includes('OXYGEN'))?.maxValue}%)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input 
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container transition-all ${fieldErrors.oxygenLevel ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'}`}
                        placeholder="e.g. 98" 
                        type="text"
                        value={oxygenLevel}
                        onChange={(e) => {
                          setOxygenLevel(e.target.value);
                          if (fieldErrors.oxygenLevel) setFieldErrors(prev => ({ ...prev, oxygenLevel: '' }));
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                    {renderFieldError('oxygenLevel')}
                  </div>
                  {/* Body Temperature */}
                  <div className="col-span-1">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-label-md font-bold text-on-surface">
                        Body Temperature
                        {vitalSettings.find(s => s.vitalName.toUpperCase().includes('TEMPERATURE')) && (
                          <span className="text-[10px] text-slate-400 ml-2 normal-case font-normal">
                            ({vitalSettings.find(s => s.vitalName.toUpperCase().includes('TEMPERATURE'))?.minValue}-{vitalSettings.find(s => s.vitalName.toUpperCase().includes('TEMPERATURE'))?.maxValue} {tempUnit === 'CELSIUS' ? '°C' : '°F'})
                          </span>
                        )}
                      </label>
                      <select 
                        className="text-xs bg-gray-100 border-none rounded px-2 py-1 font-bold"
                        value={tempUnit}
                        onChange={(e) => setTempUnit(e.target.value as any)}
                      >
                        <option value="CELSIUS">°C (Celsius)</option>
                        <option value="FAHRENHEIT">°F (Fahrenheit)</option>
                      </select>
                    </div>
                    <div className="relative">
                      <input 
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container transition-all ${fieldErrors.temperature ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'}`}
                        placeholder={tempUnit === 'CELSIUS' ? 'e.g. 36.6' : 'e.g. 98.6'} 
                        type="text"
                        value={temperature}
                        onChange={(e) => {
                          setTemperature(e.target.value);
                          if (fieldErrors.temperature) setFieldErrors(prev => ({ ...prev, temperature: '' }));
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{tempUnit === 'CELSIUS' ? '°C' : '°F'}</span>
                    </div>
                    {renderFieldError('temperature')}
                  </div>
                  {/* Weight */}
                  <div className="col-span-1">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-label-md font-bold text-on-surface">
                        Patient Weight
                        {vitalSettings.find(s => s.vitalName.toUpperCase().includes('WEIGHT')) && (
                          <span className="text-[10px] text-slate-400 ml-2 normal-case font-normal">
                            ({vitalSettings.find(s => s.vitalName.toUpperCase().includes('WEIGHT'))?.minValue}-{vitalSettings.find(s => s.vitalName.toUpperCase().includes('WEIGHT'))?.maxValue} {weightUnit.toLowerCase()})
                          </span>
                        )}
                      </label>
                      <select 
                        className="text-xs bg-gray-100 border-none rounded px-2 py-1 font-bold"
                        value={weightUnit}
                        onChange={(e) => setWeightUnit(e.target.value as any)}
                      >
                        <option value="KG">kg (Kilograms)</option>
                        <option value="LB">lb (Pounds)</option>
                      </select>
                    </div>
                    <div className="relative">
                      <input 
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-headline-sm focus:ring-2 focus:ring-primary-container transition-all ${fieldErrors.weight ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'}`}
                        placeholder={weightUnit === 'KG' ? 'e.g. 75.0' : 'e.g. 165.3'} 
                        type="text"
                        value={weight}
                        onChange={(e) => {
                          setWeight(e.target.value);
                          if (fieldErrors.weight) setFieldErrors(prev => ({ ...prev, weight: '' }));
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{weightUnit.toLowerCase()}</span>
                    </div>
                    {renderFieldError('weight')}
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
