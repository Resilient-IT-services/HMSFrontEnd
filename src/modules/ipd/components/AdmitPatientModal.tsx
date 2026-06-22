'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { ipdService } from '@/services/ipdService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { WardDTO, BedDTO, AdmissionRequestDTO } from '@/types/ipd';
import { PatientSummaryDTO } from '@/types/api';
import { useToast } from '@/components/ui/Toast';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdmitPatientModal = ({ isOpen, onClose, onSuccess }: AdmitPatientModalProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wards, setWards] = useState<WardDTO[]>([]);
  const [beds, setBeds] = useState<BedDTO[]>([]);
  const [patients, setPatients] = useState<PatientSummaryDTO[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const [formData, setFormData] = useState<AdmissionRequestDTO>({
    patientId: '',
    doctorId: '',
    bedId: '',
    admissionReason: '',
    remarks: ''
  });

  const [selectedWardId, setSelectedWardId] = useState('');

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [wardsRes, patientsRes, doctorsRes] = await Promise.all([
          ipdService.listWards({ size: 100 }),
          patientService.listSummary({ size: 50 }),
          doctorService.list({ size: 100 })
        ]);

        if (wardsRes.success) setWards(wardsRes.data?.content || []);
        if (patientsRes.success) setPatients(patientsRes.data?.content || []);
        if (doctorsRes.success) setDoctors(doctorsRes.data?.content || []);
      } catch (error) {
        console.error(error);
        showToast('Failed to load data', 'error');
      }
    }
    
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, showToast]);

  useEffect(() => {
    async function loadBeds(wardId: string) {
      if (!wardId) {
        setBeds([]);
        return;
      }
      try {
        const res = await ipdService.listWardBeds(wardId);
        if (res.success) {
          setBeds(res.data?.filter(b => b.status === 'AVAILABLE') || []);
        }
      } catch (error) {
        console.error(error);
        showToast('Failed to load beds', 'error');
      }
    }

    loadBeds(selectedWardId);
  }, [selectedWardId, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await ipdService.admitPatient(formData);
      if (res.success) {
        showToast('Patient admitted successfully', 'success');
        onSuccess();
      } else {
        showToast(res.message || 'Admission failed', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admit Patient" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Patient" required>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.patientCode})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Consulting Doctor" required>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all"
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              required
            >
              <option value="">Select Doctor</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>Dr. {d.fullName}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Ward" required>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all"
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              required
            >
              <option value="">Select Ward</option>
              {wards.map(w => (
                <option key={w.id} value={w.id}>{w.wardName} ({w.wardType})</option>
              ))}
            </select>
          </FormField>

          <FormField label="Bed" required>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all"
              value={formData.bedId}
              onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
              required
              disabled={!selectedWardId}
            >
              <option value="">Select Bed</option>
              {beds.map(b => (
                <option key={b.id} value={b.id}>Bed {b.bedNumber}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Admission Reason">
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all min-h-[80px]"
            value={formData.admissionReason}
            onChange={(e) => setFormData({ ...formData, admissionReason: e.target.value })}
            placeholder="Reason for admission..."
          />
        </FormField>

        <FormField label="Remarks">
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all min-h-[60px]"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Any additional remarks..."
          />
        </FormField>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Confirm Admission</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdmitPatientModal;
