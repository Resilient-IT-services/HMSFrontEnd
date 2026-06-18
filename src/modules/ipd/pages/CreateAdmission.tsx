'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Section } from '@/components/ui/Section';
import { ipdService } from '@/services/ipdService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { WardDTO, BedDTO, AdmissionRequestDTO } from '@/types/ipd';
import { PatientSummaryDTO, DoctorStaffResponse } from '@/types/api';
import { useToast } from '@/components/ui/Toast';
import { SearchInput } from '@/components/ui/SearchInput';

export const CreateAdmission = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Lookup Data
  const [wards, setWards] = useState<WardDTO[]>([]);
  const [beds, setBeds] = useState<BedDTO[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  
  // Patient Search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<PatientSummaryDTO[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientSummaryDTO | null>(null);

  const [formData, setFormData] = useState<AdmissionRequestDTO>({
    patientId: '',
    doctorId: '',
    bedId: '',
    admissionReason: '',
    remarks: ''
  });

  const [selectedWardId, setSelectedWardId] = useState('');

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [wardsRes, doctorsRes] = await Promise.all([
          ipdService.listWards({ size: 100 }),
          doctorService.list({ size: 100 })
        ]);
        if (wardsRes.success) setWards(wardsRes.data?.content || []);
        if (doctorsRes.success) setDoctors(doctorsRes.data?.content || []);
      } catch (error) {
        console.error(error);
        showToast('Failed to load lookup data', 'error');
      }
    };
    loadLookups();
  }, [showToast]);

  // Patient Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (patientSearch.length >= 3 && !selectedPatient) {
        const res = await patientService.listSummary({ search: patientSearch, size: 5 });
        if (res.success && res.data) setPatientResults(res.data.content);
      } else {
        setPatientResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [patientSearch, selectedPatient]);

  // Bed Lookup Logic
  useEffect(() => {
    const loadBeds = async () => {
      if (!selectedWardId) {
        setBeds([]);
        setFormData(prev => ({ ...prev, bedId: '' }));
        return;
      }
      try {
        const res = await ipdService.listWardBeds(selectedWardId);
        if (res.success) {
          setBeds(res.data?.filter(b => b.status === 'AVAILABLE' && b.active) || []);
          setFormData(prev => ({ ...prev, bedId: '' }));
        }
      } catch (error) {
        console.error(error);
        showToast('Failed to load beds', 'error');
      }
    };
    loadBeds();
  }, [selectedWardId, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.bedId) {
      showToast('Please fill all required fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await ipdService.admitPatient(formData);
      if (res.success && res.data) {
        showToast('Patient admitted successfully', 'success');
        router.push(`/ipd/admissions/${res.data.id}`);
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Admission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="New IPD Admission">
      <PageSurface>
        <div className="max-w-4xl mx-auto py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="secondary" size="sm" icon="arrow_back" onClick={() => router.back()} />
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">New IPD Admission</h1>
              <p className="text-slate-500 text-sm">Assign a patient to a ward and bed for in-patient care.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Section title="Patient Selection" icon="person">
              <div className="relative">
                <FormField label="Search Patient" required>
                  <SearchInput 
                    placeholder="Search by name, ID or phone..."
                    value={selectedPatient ? selectedPatient.fullName : patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (selectedPatient) {
                        setSelectedPatient(null);
                        setFormData(prev => ({ ...prev, patientId: '' }));
                      }
                    }}
                  />
                </FormField>
                {patientResults.length > 0 && !selectedPatient && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 mt-1 max-h-48 overflow-y-auto">
                    {patientResults.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setSelectedPatient(p);
                          setFormData(prev => ({ ...prev, patientId: p.id }));
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                      >
                        <p className="text-xs font-bold text-slate-900">{p.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{p.patientCode} • {p.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-orange-900">{selectedPatient.fullName}</p>
                      <p className="text-xs text-orange-700">{selectedPatient.patientCode}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedPatient(null);
                      setPatientSearch('');
                      setFormData(prev => ({ ...prev, patientId: '' }));
                    }}>Change</Button>
                  </div>
                )}
              </div>
            </Section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Consultation" icon="medical_services">
                <FormField label="Attending Doctor" required>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    required
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(d => (
                      <option key={d.doctorId} value={d.doctorId}>Dr. {d.fullName} ({d.specializations?.[0] || 'General'})</option>
                    ))}
                  </select>
                </FormField>
              </Section>

              <Section title="Allocation" icon="hotel">
                <div className="space-y-4">
                  <FormField label="Ward" required>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
                      value={selectedWardId}
                      onChange={(e) => setSelectedWardId(e.target.value)}
                      required
                    >
                      <option value="">Select Ward</option>
                      {wards.map(w => (
                        <option key={w.id} value={w.id!}>{w.wardName} ({w.wardType})</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Bed" required>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
                      value={formData.bedId}
                      onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                      required
                      disabled={!selectedWardId}
                    >
                      <option value="">Select Bed</option>
                      {beds.map(b => (
                        <option key={b.id} value={b.id!}>Bed {b.bedNumber}</option>
                      ))}
                    </select>
                    {!selectedWardId && <p className="text-[10px] text-slate-400 mt-1">Please select a ward first</p>}
                    {selectedWardId && beds.length === 0 && <p className="text-[10px] text-red-500 mt-1">No available beds in this ward</p>}
                  </FormField>
                </div>
              </Section>
            </div>

            <Section title="Notes" icon="description">
              <div className="space-y-4">
                <FormField label="Admission Reason">
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 min-h-[100px]"
                    value={formData.admissionReason}
                    onChange={(e) => setFormData({ ...formData, admissionReason: e.target.value })}
                    placeholder="Enter reason for admission..."
                  />
                </FormField>
                <FormField label="Remarks">
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 min-h-[80px]"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Any additional remarks..."
                  />
                </FormField>
              </div>
            </Section>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" size="lg" isLoading={loading} disabled={!formData.bedId}>Confirm Admission</Button>
            </div>
          </form>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
