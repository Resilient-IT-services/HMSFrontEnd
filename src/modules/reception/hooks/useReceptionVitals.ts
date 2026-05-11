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
  const [tempUnit, setTempUnit] = useState<'CELSIUS' | 'FAHRENHEIT'>('CELSIUS');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>('KG');
  const [oxygenLevel, setOxygenLevel] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState(''); 
  const [complaints, setComplaints] = useState('');

  const [vitalRanges, setVitalRanges] = useState<VitalRangesResponse>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const rangeRes = await adminService.getVitalRanges({ skipToast: true });
        if (rangeRes.success && rangeRes.data) {
          setVitalRanges(rangeRes.data);
          if (rangeRes.data.BODY_TEMPERATURE?.unit) {
            const unit = rangeRes.data.BODY_TEMPERATURE.unit;
            setTempUnit(unit === 'F' || unit === 'FAHRENHEIT' ? 'FAHRENHEIT' : 'CELSIUS');
          }
          if (rangeRes.data.WEIGHT?.unit) {
            const unit = rangeRes.data.WEIGHT.unit;
            setWeightUnit(unit.toUpperCase() === 'LB' ? 'LB' : 'KG');
          }
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
    const tUnit = (vitals.temperatureUnit as string);
    setTempUnit(tUnit === '°C' || tUnit === 'CELSIUS' ? 'CELSIUS' : 'FAHRENHEIT');
    setWeight(vitals.weight?.toString() || '');
    const wUnit = (vitals.weightUnit as string);
    setWeightUnit(wUnit === 'kg' || wUnit === 'KG' ? 'KG' : 'LB');
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
      case 'temperature': range = vitalRanges.BODY_TEMPERATURE; label = 'Temperature'; break;
      case 'weight': range = vitalRanges.WEIGHT; label = 'Weight'; break;
      case 'oxygenLevel': range = vitalRanges.OXYGEN_LEVEL; label = 'Oxygen Level'; break;
      case 'systolic': range = vitalRanges.SYSTOLIC_BP; label = 'Systolic BP'; break;
      case 'diastolic': range = vitalRanges.DIASTOLIC_BP; label = 'Diastolic BP'; break;
      case 'heartRate': range = vitalRanges.HEART_RATE; label = 'Heart Rate'; break;
      case 'respiratoryRate': range = vitalRanges.RESPIRATORY_RATE; label = 'Respiratory Rate'; required = false; break;
    }
    const error = validateVital(value, range, label || field, required);
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
      const vitals: VitalsDTO = {
        bloodPressure: `${systolic}/${diastolic}`,
        systolic: parseInt(systolic) || 0,
        diastolic: parseInt(diastolic) || 0,
        heartRate: parseInt(heartRate) || 0,
        temperature: parseFloat(temperature) || 0,
        temperatureUnit: tempUnit,
        weight: parseFloat(weight) || 0,
        weightUnit: weightUnit,
        oxygenLevel: parseFloat(oxygenLevel) || 0,
        respiratoryRate: parseFloat(respiratoryRate) || 0,
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
  };
};
