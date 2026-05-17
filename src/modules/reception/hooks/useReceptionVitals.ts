'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { adminService } from '@/services/adminService';
import { AppointmentResponse, PatientResponse, VitalsDTO, VitalRangesResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { validateVital } from '@/utils/vitalsValidator';

export const useReceptionVitals = () => {
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
  const [oxygenLevel, setOxygenLevel] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState(''); 
  const [complaints, setComplaints] = useState('');

  // UI state for local conversion
  const [displayTempUnit, setDisplayTempUnit] = useState<'C' | 'F'>('C');
  const [displayWeightUnit, setDisplayWeightUnit] = useState<'KG' | 'LB'>('KG');

  const [vitalRanges, setVitalRanges] = useState<VitalRangesResponse>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const rangeRes = await adminService.getVitalRanges({ skipToast: true });
        if (rangeRes.success && rangeRes.data) {
          setVitalRanges(rangeRes.data);
        }
      } catch (error) {
        console.error('Failed to load vitals config', error);
      }
    };
    fetchConfig();
  }, []);

  const populateVitals = useCallback((vitals: any) => {
    if (!vitals) return;
    setSystolic(vitals.systolic?.toString() || vitals.bloodPressure?.split('/')[0] || '');
    setDiastolic(vitals.diastolic?.toString() || vitals.bloodPressure?.split('/')[1] || '');
    setHeartRate(vitals.heartRate?.toString() || '');
    setTemperature(vitals.temperature?.toString() || '');
    setWeight(vitals.weight?.toString() || '');
    setOxygenLevel(vitals.oxygenLevel?.toString() || '');
    setRespiratoryRate(vitals.respiratoryRate?.toString() || '');
  }, []);

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
          populateVitals(appRes.data.vitals);
          const patRes = await patientService.get(appRes.data.patientId);
          if (patRes.success && patRes.data) setPatient(patRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch details', error);
        triggerGlobalToast('Failed to load appointment', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [appointmentId, populateVitals]);

  const patientAge = useMemo(() => {
    if (!patient?.dob) return '--';
    const birthDate = new Date(patient.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, [patient]);

  const validateField = (field: string, value: any) => {
    let range;
    let label;
    let required = true;
    switch (field) {
      case 'temperature': { range = vitalRanges.BODY_TEMPERATURE; label = 'Temperature'; break; }
      case 'weight': { range = vitalRanges.WEIGHT; label = 'Weight'; break; }
      case 'oxygenLevel': { range = vitalRanges.OXYGEN_LEVEL; label = 'Oxygen Level'; break; }
      case 'systolic': { range = vitalRanges.SYSTOLIC_BP; label = 'Systolic BP'; break; }
      case 'diastolic': { range = vitalRanges.DIASTOLIC_BP; label = 'Diastolic BP'; break; }
      case 'heartRate': { range = vitalRanges.HEART_RATE; label = 'Heart Rate'; break; }
      case 'respiratoryRate': { range = vitalRanges.RESPIRATORY_RATE; label = 'Respiratory Rate'; required = false; break; }
    }
    
    // For validation, we convert local display value to metric if needed
    let valueToValidate = Number.parseFloat(value);
    if (field === 'temperature' && displayTempUnit === 'F') {
      valueToValidate = (valueToValidate - 32) * 5 / 9;
    } else if (field === 'weight' && displayWeightUnit === 'LB') {
      valueToValidate = valueToValidate / 2.20462;
    }

    const error = validateVital(valueToValidate, range, label || field, required);
    setFieldErrors(prev => ({ ...prev, [field]: error || '' }));
    return !error;
  };

  const validateAll = () => {
    const errors: Record<string, string> = {};
    const checks = [
      { f: 'temperature', v: temperature }, { f: 'weight', v: weight }, { f: 'oxygenLevel', v: oxygenLevel },
      { f: 'systolic', v: systolic }, { f: 'diastolic', v: diastolic }, { f: 'heartRate', v: heartRate },
      { f: 'respiratoryRate', v: respiratoryRate }
    ];
    let isValid = true;
    checks.forEach(c => { if (!validateField(c.f, c.v)) isValid = false; });
    return isValid;
  };

  const handleSave = async () => {
    if (!appointment || !validateAll()) {
      triggerGlobalToast('Please correct validation errors', 'error');
      return;
    }
    setSaving(true);
    try {
      let finalTemp = Number.parseFloat(temperature) || 0;
      if (displayTempUnit === 'F') {
        finalTemp = (finalTemp - 32) * 5 / 9;
      }

      let finalWeight = Number.parseFloat(weight) || 0;
      if (displayWeightUnit === 'LB') {
        finalWeight = finalWeight / 2.20462;
      }

      const vitals: VitalsDTO = {
        bloodPressure: `${systolic}/${diastolic}`,
        systolic: Number.parseInt(systolic) || 0,
        diastolic: Number.parseInt(diastolic) || 0,
        heartRate: Number.parseInt(heartRate) || 0,
        temperature: finalTemp,
        weight: finalWeight,
        oxygenLevel: Number.parseFloat(oxygenLevel) || 0,
        respiratoryRate: Number.parseFloat(respiratoryRate) || 0,
      };

      const res = await appointmentService.update(appointment.id, { 
        ...appointment, vitals, notes: complaints, status: 'SCHEDULED'
      }, { skipToast: true });

      if (res.success) {
        triggerGlobalToast('Vitals captured successfully', 'success');
        router.push('/reception/appointments');
      }
    } catch (error: any) {
      console.error('Save Error:', error);
      triggerGlobalToast(error.response?.data?.message || 'Failed to save vitals', 'error');
    } finally {
      setSaving(false);
    }
  };

  return {
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
    handleSave
  };
};
