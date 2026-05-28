'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { hospitalService } from '@/services/hospitalService';
import { AppointmentResponse, PatientResponse, HospitalResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken } from '@/utils/tokenHelper';
import DigitalPrescription from '@/components/doctor/DigitalPrescription';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { PageSurface } from '@/components/ui/PageSurface';

import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';

const MedicineSearchInput = ({ 
  value, 
  onChange, 
  onSelect,
  error
}: { 
  value: string; 
  onChange: (val: string) => void;
  onSelect: (med: any) => void;
  error?: boolean;
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastFetchedSearch = useRef('');

  if (value !== prevValue) {
    setSearchTerm(value);
    setPrevValue(value);
  }

  useEffect(() => {
    const fetchMedicines = async () => {
      const trimmedSearch = debouncedSearch?.trim() || '';
      if (trimmedSearch.length < 2) {
        setResults([]);
        return;
      }
      if (trimmedSearch === lastFetchedSearch.current) return;

      setLoading(true);
      try {
        const res = await pharmacyApi.getMedicinesSummary({ search: trimmedSearch, size: 10 });
        if (res.success && res.data) {
          lastFetchedSearch.current = trimmedSearch;
          setResults(res.data.content || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchMedicines();
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm font-bold outline-none transition-all text-slate-900 ${
          error ? 'border-red-500' : 'border-slate-200 focus:border-slate-400'
        }`}
        placeholder="Search medicine..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
      />

      {showResults && (searchTerm.length >= 2 || results.length > 0) && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
          {loading && <div className="p-3 text-xs text-slate-400 font-bold italic">Searching...</div>}
          {results.map((med) => (
            <button
              key={med.id}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-center justify-between group"
              onClick={() => {
                onSelect(med);
                setShowResults(false);
              }}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors truncate">{med.name}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{med.genericName || med.category}</span>
              </div>
              <div className="flex flex-col items-end shrink-0 ml-3">
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                  (med.currentStock || med.totalQuantity || 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {(med.currentStock || med.totalQuantity || 0) > 0 ? 'In Stock' : 'No Stock'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const parseFreq = (val: string): number => {
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? 0 : n;
};

export const ActiveConsultationPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');
  const { user } = useSelector((state: RootState) => state.auth);

  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [hospital, setHospital] = useState<HospitalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [complaints, setComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const res = await appointmentService.get(appointmentId);
      if (res.success && res.data) {
        setAppointment(res.data);
        setComplaints(res.data.chiefComplaints || '');
        setDiagnosis(res.data.diagnosis || '');

        if (res.data.prescription?.items) {
          setPrescriptions(res.data.prescription.items.map((item, idx) => {
            const dosageParts = (item.dosage || '0-0-0').split('-');
            return {
              id: item.id || `existing-${idx}`,
              medicineId: item.medicineId,
              medicine: item.medicineName,
              freqM: dosageParts[0] === '0' ? '' : dosageParts[0],
              freqA: dosageParts[1] === '0' ? '' : dosageParts[1],
              freqN: dosageParts[2] === '0' ? '' : dosageParts[2],
              duration: Number.parseInt(item.duration) || 0,
              inStock: true
            };
          }));
        } else {
          setPrescriptions([{ id: '1', medicineId: '', medicine: '', freqM: '', freqA: '', freqN: '', duration: 0, inStock: true }]);
        }

        const pRes = await patientService.get(res.data.patientId);
        if (pRes.success && pRes.data) setPatient(pRes.data);

        if (user?.currentHospitalId) {
          const hRes = await hospitalService.getById(user.currentHospitalId);
          if (hRes.success && hRes.data) setHospital(hRes.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      triggerGlobalToast('Failed to fetch details', 'error');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, user]);

  useEffect(() => {
    if (appointmentId) void fetchAppointment();
  }, [appointmentId, fetchAppointment]);

  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { id: Date.now().toString(), medicineId: '', medicine: '', freqM: '', freqA: '', freqN: '', duration: 0, inStock: true }]);
  };

  const removePrescriptionRow = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const updatePrescriptionRow = (id: string, field: string, value: any) => {
    if (['freqM', 'freqA', 'freqN'].includes(field)) {
      const singleDigit = value.toString().slice(-1);
      if (value !== '' && !/^\d$/.test(singleDigit)) return;
      setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, [field]: singleDigit } : p));
    } else {
      setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, [field]: value } : p));
    }
  };

  const selectMedicine = (id: string, med: any) => {
    const stock = med.currentStock || med.totalQuantity || 0;
    setPrescriptions(prescriptions.map(p => p.id === id ? {
      ...p,
      medicine: med.name || med.medicineName,
      medicineId: med.id || med.medicineId,
      inStock: stock > 0
    } : p));
  };

  const saveConsultation = async (silent = false) => {
    if (!appointmentId || !appointment) return false;
    try {
      const updateData = {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentTime: appointment.appointmentTime,
        chiefComplaints: complaints,
        diagnosis: diagnosis,
        prescription: {
          appointmentId: appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          items: prescriptions.filter(p => p.medicine).map(p => {
            const fM = p.freqM || '0';
            const fA = p.freqA || '0';
            const fN = p.freqN || '0';
            const total = (parseFreq(fM) + parseFreq(fA) + parseFreq(fN)) * (p.duration || 0);
            return {
              medicineId: p.medicineId,
              medicineName: p.medicine,
              dosage: `${fM}-${fA}-${fN}`,
              duration: `${p.duration} days (Total: ${total} units)`
            };
          })
        }
      };
      const res = await appointmentService.updateConsultation(appointmentId, updateData as any);
      if (res.success && !silent) triggerGlobalToast('Saved successfully', 'success');
      return res.success;
    } catch (error) {
      console.error('Failed to save:', error);
      if (!silent) triggerGlobalToast('Failed to save', 'error');
      return false;
    }
  };

  const handleComplete = async () => {
    const saved = await saveConsultation(true);
    if (!saved) return;
    try {
      const statusRes = await appointmentService.completeConsultation(appointmentId!);
      if (statusRes.success) {
        triggerGlobalToast('Consultation completed', 'success');
        router.push('/doctor/dashboard');
      }
    } catch (error) {
      console.error('Failed to complete:', error);
    }
  };

  if (loading) return <MainLayout title="Active Consultation">Loading...</MainLayout>;
  if (!appointment) return <MainLayout title="Active Consultation">Not found</MainLayout>;

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  return (
    <MainLayout title={`Consultation: ${appointment.patientName}`}>
      <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
        <div className="space-y-6 py-4">
          <div className="flex flex-col h-full">
            {/* Header Area */}
            <div className="p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20 shadow-sm rounded-2xl">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{appointment.patientName}</h2>
                  <span className="bg-orange-600/10 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded border border-orange-600/20 uppercase tracking-widest">{formatToken(appointment)}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-xs mt-2 font-medium">
                  <span>{patient?.gender}</span><span>•</span><span>{patient?.dob ? calculateAge(patient.dob) : '--'} Yrs</span><span>•</span>
                  <span className="flex items-center gap-1 text-slate-400"><span className="material-symbols-outlined text-xs">event</span>{new Date(appointment.appointmentTime).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => saveConsultation()} icon="save" className="hidden sm:flex text-xs h-10 font-black">Save</Button>
                <Button variant="secondary" onClick={() => setShowPreview(true)} icon="visibility" className="text-xs h-10 font-black">Preview</Button>
                <Button onClick={handleComplete} icon="task_alt" className="text-xs h-10 font-black shadow-lg shadow-orange-600/20">Complete</Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-12 gap-6">
              {/* Left Column: Patient Info & Vitals */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 px-1">
                    <span className="material-symbols-outlined text-sm">analytics</span> Patient Vitals
                  </h3>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: 'Heart Rate', value: appointment.vitals?.heartRate, unit: 'BPM', icon: 'favorite', color: 'text-orange-600', bg: 'bg-orange-50' },
                      { label: 'Temp', value: appointment.vitals?.temperature, unit: '°F', icon: 'device_thermostat', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Weight', value: appointment.vitals?.weight, unit: 'kg', icon: 'monitor_weight', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { label: 'BP', value: appointment.vitals?.bloodPressure, unit: '', icon: 'blood_pressure', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'SpO2', value: appointment.vitals?.oxygenLevel, unit: '%', icon: 'air', color: 'text-cyan-600', bg: 'bg-cyan-50' }
                    ].map((v) => (
                      <div key={v.label} className={`${v.bg} p-2 rounded-xl border border-white/50 shadow-inner flex flex-col justify-center min-w-0`}>
                        <span className="text-[8px] uppercase font-black text-slate-500/70 block mb-0.5 truncate">{v.label}</span>
                        <div className={`flex items-center gap-1 ${v.color}`}>
                          <span className="material-symbols-outlined text-[14px] shrink-0">{v.icon}</span>
                          <span className="font-black text-[11px] sm:text-xs truncate">
                            {v.value || '--'}
                            <small className="text-[8px] ml-0.5 opacity-60">{v.unit}</small>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex-1 flex flex-col min-h-[500px]">
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">record_voice_over</span> Complaints
                    </h3>
                    <textarea className="w-full flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold text-slate-700 resize-none transition-all focus:border-slate-300" value={complaints || appointment.notes || ''} onChange={(e) => setComplaints(e.target.value)} />
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">medical_information</span> Diagnosis
                    </h3>
                    <textarea className="w-full flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-black text-slate-900 resize-none transition-all focus:border-slate-300" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Right Column: Prescription Table */}
              <div className="col-span-12 lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[600px] flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-600">medication_liquid</span> Prescription
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Manage patient medications</span>
                    </div>
                    <button onClick={addPrescriptionRow} className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 bg-orange-600 px-5 py-2.5 rounded-xl shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all active:scale-95 outline-none focus:ring-0">
                      <span className="material-symbols-outlined text-sm">add_circle</span> Add New
                    </button>
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Header Row */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-2 mb-2">
                      <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine Name</div>
                      <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dosage (M-A-N)</div>
                      <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Days</div>
                      <div className="col-span-1"></div>
                    </div>

                    {prescriptions.map((p) => (
                      <div key={p.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50/50 p-2 md:p-3 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative">
                        <div className="col-span-12 md:col-span-5">
                          <MedicineSearchInput value={p.medicine} onChange={(val) => updatePrescriptionRow(p.id, 'medicine', val)} onSelect={(med) => selectMedicine(p.id, med)} />
                          {p.medicine && (
                             <div className="mt-1 flex items-center gap-1.5 px-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                <span className={`text-[9px] font-black uppercase ${p.inStock ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {p.inStock ? 'Available' : 'Out of Stock'}
                                </span>
                             </div>
                          )}
                        </div>
                        <div className="col-span-8 md:col-span-4 flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                          {[ { l: 'MORNING', f: 'freqM' }, { l: 'AFTERNOON', f: 'freqA' }, { l: 'NIGHT', f: 'freqN' } ].map(time => (
                            <div key={time.f} className="flex flex-col items-center flex-1 border-r last:border-0 border-slate-100 py-1">
                              <span className="text-[7px] font-black text-slate-400 mb-0.5">{time.l}</span>
                              <input
                                type="text"
                                className="w-full text-center text-sm font-black text-slate-900 outline-none bg-transparent h-7 focus:text-orange-600 transition-colors"
                                placeholder="-"
                                value={p[time.f]}
                                onChange={(e) => updatePrescriptionRow(p.id, time.f, e.target.value)}
                                maxLength={1}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="col-span-3 md:col-span-2">
                          <div className="relative group/dur">
                            <input
                              type="number"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-slate-400 text-center shadow-sm"
                              placeholder="0"
                              value={p.duration || ''}
                              onChange={(e) => updatePrescriptionRow(p.id, 'duration', Number.parseInt(e.target.value) || 0)}
                            />
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[7px] px-1 rounded opacity-0 group-focus-within/dur:opacity-100 transition-opacity">DAYS</span>
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => removePrescriptionRow(p.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all md:opacity-0 group-hover:opacity-100">
                            <span className="material-symbols-outlined text-lg">delete_sweep</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {prescriptions.length === 0 && (
                      <div className="py-24 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                        <span className="material-symbols-outlined text-5xl mb-3 opacity-20">medical_services</span>
                        <p className="text-sm font-bold">No medications added to the plan.</p>
                        <button onClick={addPrescriptionRow} className="mt-4 text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline">+ Add First Medicine</button>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 p-4 bg-orange-600/5 rounded-2xl border border-orange-600/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-600/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-orange-600">calculate</span>
                    </div>
                    <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase tracking-tight">
                      Total units will be auto-calculated for pharmacy dispensing. Ensure dosage and duration are accurate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageSurface>

      {showPreview && (
        <DigitalPrescription
          isOpen={showPreview} onClose={() => setShowPreview(false)} patient={patient} doctor={user} hospital={hospital} complaints={complaints} diagnosis={diagnosis}
          prescriptions={prescriptions.filter(p => p.medicine).map(p => {
            const fM = p.freqM || '0';
            const fA = p.freqA || '0';
            const fN = p.freqN || '0';
            const total = (parseFreq(fM) + parseFreq(fA) + parseFreq(fN)) * (p.duration || 0);
            return {
              ...p,
              dosage: `${fM}-${fA}-${fN}`,
              duration: `${p.duration} days (Total: ${total} units)`
            };
          })}
          vitals={{
            heartRate: appointment?.vitals?.heartRate?.toString() || '--',
            temp: appointment?.vitals?.temperature?.toString() || '--',
            bp: appointment?.vitals?.bloodPressure || '--',
            weight: appointment?.vitals?.weight?.toString() || '--',
            spo2: appointment?.vitals?.oxygenLevel?.toString() || '--'
          }}
          date={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          tokenDisplay={formatToken(appointment)}
        />
      )}
    </MainLayout>
  );
};
