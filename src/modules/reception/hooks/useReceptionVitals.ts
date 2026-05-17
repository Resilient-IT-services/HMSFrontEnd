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

  // UI state for local conversion with persistence
  const [displayTempUnit, setDisplayTempUnitState] = useState<'C' | 'F'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('hms_vitals_temp_unit') as 'C' | 'F') || 'C';
    }
    return 'C';
  });

  const [displayWeightUnit, setDisplayWeightUnitState] = useState<'KG' | 'LB'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('hms_vitals_weight_unit') as 'KG' | 'LB') || 'KG';
    }
    return 'KG';
  });

  const setDisplayTempUnit = (unit: 'C' | 'F') => {
    if (unit === displayTempUnit) return;
    setDisplayTempUnitState(unit);
    localStorage.setItem('hms_vitals_temp_unit', unit);
    if (temperature) {
      const val = Number.parseFloat(temperature);
      if (unit === 'F') {
        // Converting C -> F
        setTemperature((val * 9 / 5 + 32).toFixed(1));
      } else {
        // Converting F -> C
        setTemperature(((val - 32) * 5 / 9).toFixed(1));
      }
    }
  };

  const setDisplayWeightUnit = (unit: 'KG' | 'LB') => {
    if (unit === displayWeightUnit) return;
    setDisplayWeightUnitState(unit);
    localStorage.setItem('hms_vitals_weight_unit', unit);
    if (weight) {
      const val = Number.parseFloat(weight);
      if (unit === 'LB') {
        // Converting KG -> LB
        setWeight((val * 2.20462).toFixed(1));
      } else {
        // Converting LB -> KG
        setWeight((val / 2.20462).toFixed(1));
      }
    }
  };

  /**
   * Helper to format ranges in the currently selected display unit
   */
  const formatRangeInSelectedUnit = (type: string) => {
    const range = vitalRanges[type];
    if (!range) return '--';

    let min = range.minValue;
    let max = range.maxValue;
    let unitLabel = '';

    if (type === 'BODY_TEMPERATURE') {
      unitLabel = `°${displayTempUnit}`;
      // Backend is F
      if (displayTempUnit === 'C') {
        min = ((min - 32) * 5 / 9);
        max = ((max - 32) * 5 / 9);
      }
    } else if (type === 'WEIGHT') {
      unitLabel = displayWeightUnit.toLowerCase();
      // Backend is KG
      if (displayWeightUnit === 'LB') {
        min = min * 2.20462;
        max = max * 2.20462;
      }
    } else {
      switch (type) {
        case 'SYSTOLIC_BP':
        case 'DIASTOLIC_BP': unitLabel = 'mmHg'; break;
        case 'HEART_RATE': unitLabel = 'bpm'; break;
        case 'OXYGEN_LEVEL': unitLabel = '%'; break;
      }
    }

    return `${min.toFixed(type === 'BODY_TEMPERATURE' || type === 'WEIGHT' ? 1 : 0)} - ${max.toFixed(type === 'BODY_TEMPERATURE' || type === 'WEIGHT' ? 1 : 0)} ${unitLabel}`;
  };

  const [vitalRanges, setVitalRanges] = useState<VitalRangesResponse>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const rangeRes = await adminService.listVitalSettings({ skipToast: true });
        if (rangeRes.success && rangeRes.data) {
          const configMap: VitalRangesResponse = {};
          rangeRes.data.forEach(item => {
            configMap[item.vitalType] = {
              minValue: item.minValue,
              maxValue: item.maxValue
            };
          });
          setVitalRanges(configMap);
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
    
    // Temperature conversion for display (Backend is F)
    if (vitals.temperature !== undefined && vitals.temperature !== null) {
      let temp = Number(vitals.temperature);
      if (displayTempUnit === 'C') {
        // F -> C
        temp = (temp - 32) * 5 / 9;
      }
      setTemperature(temp.toFixed(1));
    } else {
      setTemperature('');
    }

    // Weight conversion for display (Backend is KG)
    if (vitals.weight !== undefined && vitals.weight !== null) {
      let w = Number(vitals.weight);
      if (displayWeightUnit === 'LB') {
        // KG -> LB
        w = w * 2.20462;
      }
      setWeight(w.toFixed(1));
    } else {
      setWeight('');
    }

    setOxygenLevel(vitals.oxygenLevel?.toString() || '');
    setRespiratoryRate(vitals.respiratoryRate?.toString() || '');
  }, [displayTempUnit, displayWeightUnit]);

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

  const getFieldError = (field: string, value: any) => {
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
    
    let valueToValidate = value;
    if (value !== '' && value !== null && value !== undefined) {
      const num = Number.parseFloat(value);
      if (!Number.isNaN(num)) {
        valueToValidate = num;
        if (field === 'temperature' && displayTempUnit === 'C') {
          // Convert C to F to validate against backend range
          valueToValidate = (num * 9 / 5 + 32);
        } else if (field === 'weight' && displayWeightUnit === 'LB') {
          // Convert LB to KG to validate against backend range
          valueToValidate = num / 2.20462;
        }
      }
    }

    return validateVital(valueToValidate, range, label || field, required);
  };

  const validateField = (field: string, value: any) => {
    const error = getFieldError(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error || '' }));
    return !error;
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    const checks = [
      { f: 'temperature', v: temperature }, { f: 'weight', v: weight }, { f: 'oxygenLevel', v: oxygenLevel },
      { f: 'systolic', v: systolic }, { f: 'diastolic', v: diastolic }, { f: 'heartRate', v: heartRate },
      { f: 'respiratoryRate', v: respiratoryRate }
    ];
    
    checks.forEach(c => {
      const error = getFieldError(c.f, c.v);
      if (error) newErrors[c.f] = error;
    });

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!appointment || !validateAll()) {
      triggerGlobalToast('Please correct validation errors', 'error');
      return;
    }
    setSaving(true);
    try {
      let finalTemp = Number.parseFloat(temperature) || 0;
      if (displayTempUnit === 'C') {
        // Convert C to F for backend
        finalTemp = (finalTemp * 9 / 5 + 32);
      }

      let finalWeight = Number.parseFloat(weight) || 0;
      if (displayWeightUnit === 'LB') {
        // Convert LB to KG for backend
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
    handleSave,
    formatRangeInSelectedUnit
  };
};
