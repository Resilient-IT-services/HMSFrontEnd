'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { VitalsDTO, AppointmentResponse } from '@/types/api';
import { appointmentService } from '@/services/appointmentService';
import { triggerGlobalToast } from '@/components/ui/Toast';

interface VitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentResponse | null;
  onSuccess: () => void;
}

const VitalsModal: React.FC<VitalsModalProps> = ({ isOpen, onClose, appointment, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState<VitalsDTO>({
    bloodPressure: '',
    heartRate: 72,
    temperature: 36.6,
    weight: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof VitalsDTO, string>>>({});

  // Reset form when appointment changes or modal opens
  React.useEffect(() => {
    if (appointment) {
      setVitals({
        bloodPressure: appointment.vitals?.bloodPressure || '',
        heartRate: appointment.vitals?.heartRate || 72,
        temperature: appointment.vitals?.temperature || 36.6,
        weight: appointment.vitals?.weight || 0,
      });
      setErrors({});
    }
  }, [appointment, isOpen]);

  const validate = () => {
    const newErrors: Partial<Record<keyof VitalsDTO, string>> = {};
    
    if (!/^\d{2,3}\/\d{2,3}$/.test(vitals.bloodPressure)) {
      newErrors.bloodPressure = 'Invalid format (e.g. 120/80)';
    }
    
    if (vitals.heartRate < 30 || vitals.heartRate > 250) {
      newErrors.heartRate = 'Heart rate must be between 30 and 250';
    }
    
    if (vitals.temperature < 30 || vitals.temperature > 45) {
      newErrors.temperature = 'Temperature must be between 30.0 and 45.0';
    }
    
    if (vitals.weight <= 0) {
      newErrors.weight = 'Weight must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !validate()) return;

    setLoading(true);
    try {
      const originalTime = new Date(appointment.appointmentTime);
      const now = new Date();
      
      let safeAppointmentTime = appointment.appointmentTime;
      
      if (originalTime <= now) {
        // If time has passed, nudge to 5 minutes from now.
        // We MUST format manually to avoid UTC conversion issues with toISOString()
        const future = new Date(now.getTime() + 5 * 60 * 1000); 
        const pad = (n: number) => n.toString().padStart(2, '0');
        safeAppointmentTime = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}:${pad(future.getSeconds())}`;
      }

      const res = await appointmentService.update(appointment.id, {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentTime: safeAppointmentTime,
        vitals: vitals
      });

      if (res.success) {
        triggerGlobalToast('Vitals saved successfully', 'success');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save vitals', error);
      // The error toast is handled automatically by apiClient interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Capture Vitals - ${appointment?.patientName}`}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <FormField label="Blood Pressure (Systolic/Diastolic)" error={errors.bloodPressure} required>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder="120/80"
            value={vitals.bloodPressure}
            onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Heart Rate (BPM)" error={errors.heartRate} required>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="72"
              value={vitals.heartRate}
              onChange={(e) => setVitals({ ...vitals, heartRate: parseInt(e.target.value) || 0 })}
            />
          </FormField>

          <FormField label="Temperature (°C)" error={errors.temperature} required>
            <input
              type="number"
              step="0.1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="36.6"
              value={vitals.temperature}
              onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) || 0 })}
            />
          </FormField>
        </div>

        <FormField label="Weight (kg)" error={errors.weight} required>
          <input
            type="number"
            step="0.1"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder="70.5"
            value={vitals.weight}
            onChange={(e) => setVitals({ ...vitals, weight: parseFloat(e.target.value) || 0 })}
          />
        </FormField>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-700 text-white rounded-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Vitals'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VitalsModal;
