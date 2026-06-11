'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Modal } from '@/components/ui/Modal';
import { useDebounce } from '@/hooks/useDebounce';
import { useClickOutside } from '@/hooks/useClickOutside';
import { PageSurface } from '@/components/ui/PageSurface';

import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { labApi } from '@/modules/lab/api/labApi';

const LabTestSearchInput = ({ 
  value, 
  onChange, 
  onSelect,
  error
}: { 
  value: string; 
  onChange: (val: string) => void;
  onSelect: (test: any) => void;
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
    const fetchTests = async () => {
      const trimmedSearch = debouncedSearch?.trim() || '';
      if (trimmedSearch.length < 2) {
        setResults([]);
        return;
      }
      if (trimmedSearch === lastFetchedSearch.current) return;

      setLoading(true);
      try {
        const res = await labApi.getTests(); // Current API gets all, ideally needs search params
        if (res.success && res.data) {
          const filtered = res.data.filter(t => 
            t.testName.toLowerCase().includes(trimmedSearch.toLowerCase()) || 
            t.testCode.toLowerCase().includes(trimmedSearch.toLowerCase())
          );
          lastFetchedSearch.current = trimmedSearch;
          setResults(filtered.slice(0, 10));
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Failed to fetch tests:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchTests();
  }, [debouncedSearch]);

  useClickOutside(wrapperRef, () => setShowResults(false));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm font-bold outline-none transition-all text-slate-900 ${
          error ? 'border-red-500' : 'border-slate-200 focus:border-slate-400'
        }`}
        placeholder="Search lab test..."
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
          {results.map((test) => (
            <button
              key={test.id}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-center justify-between group"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(test);
                setShowResults(false);
              }}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors truncate">{test.testName}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{test.testCode} • {test.departmentName}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

  useClickOutside(wrapperRef, () => setShowResults(false));

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
  if (!val) return 0;
  if (val.includes('/')) {
    const parts = val.split('/');
    if (parts.length === 2) {
      const num = Number.parseFloat(parts[0]);
      const den = Number.parseFloat(parts[1]);
      return den === 0 ? 0 : num / den;
    }
  }
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? 0 : n;
};

const calculateTotal = (p: any) => {
  const daily = parseFreq(p.freqM || '0') + parseFreq(p.freqA || '0') + parseFreq(p.freqN || '0');
  const multiplier = p.durationUnit === 'weeks' ? 7 : (p.durationUnit === 'months' ? 30 : 1);
  return Math.ceil(daily * (p.duration || 0) * multiplier);
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
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showEmptyPrescriptionModal, setShowEmptyPrescriptionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<AppointmentResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'meds' | 'labs'>('meds');

  const fetchHistory = async () => {
    if (!appointment?.patientId || !appointment?.doctorId) return;
    setLoadingHistory(true);
    setCurrentHistoryIndex(0);
    try {
      const res = await appointmentService.list({
        patientId: appointment.patientId,
        // Removed doctorId filter to show full patient history across all doctors
        size: 50
      });
      if (res.success && res.data) {
        // Include current appointment and past ones, sort by time descending
        // This allows the doctor to see "Current Session" in the history modal if it has data
        const filtered = res.data.content
          .filter(a => (a.status === 'COMPLETED' || a.status === 'PRESCRIPTION_FINALIZED' || a.status === 'CONSULTATION_STARTED' || a.id === appointmentId))
          .sort((a, b) => {
            // If it's the current appointment, always put it at the top
            if (a.id === appointmentId) return -1;
            if (b.id === appointmentId) return 1;
            return new Date(b.appointmentTime).getTime() - new Date(a.appointmentTime).getTime();
          });
        setHistoryList(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      triggerGlobalToast('Failed to load history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal) {
      void fetchHistory();
    }
  }, [showHistoryModal]);

  useEffect(() => {
    const fetchAppointmentData = async () => {
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
              const durationParts = (item.duration || '0 days').split(' ');
              return {
                id: item.id || `existing-${idx}`,
                medicineId: item.medicineId,
                medicine: item.medicineName,
                freqM: dosageParts[0] === '0' ? '' : dosageParts[0],
                freqA: dosageParts[1] === '0' ? '' : dosageParts[1],
                freqN: dosageParts[2] === '0' ? '' : dosageParts[2],
                duration: Number.parseInt(durationParts[0]) || 0,
                durationUnit: durationParts[1] || 'days',
                inStock: true
              };
            }));
          } else {
            setPrescriptions([{ id: '1', medicineId: '', medicine: '', freqM: '', freqA: '', freqN: '', duration: 0, durationUnit: 'days', inStock: true }]);
          }

          if (res.data.prescription?.labItems) {
            setInvestigations(res.data.prescription.labItems.map((item, idx) => ({
              id: item.id || `existing-lab-${idx}`,
              testId: item.testId,
              testName: item.testName,
              testCode: ''
            })));
          } else {
            setInvestigations([]);
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
    };

    if (appointmentId) void fetchAppointmentData();
  }, [appointmentId, user?.currentHospitalId]);

  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { id: Date.now().toString(), medicineId: '', medicine: '', freqM: '', freqA: '', freqN: '', duration: 0, durationUnit: 'days', inStock: true }]);
  };

  const removePrescriptionRow = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const addInvestigationRow = () => {
    setInvestigations([...investigations, { id: Date.now().toString(), testId: '', testName: '', testCode: '', notes: '' }]);
  };

  const removeInvestigationRow = (id: string) => {
    setInvestigations(investigations.filter(i => i.id !== id));
  };

  const updateInvestigationRow = (id: string, field: string, value: any) => {
    setInvestigations(investigations.map(i => i.id === id ? {
      ...i,
      [field]: value
    } : i));
  };

  const onSelectInvestigation = (id: string, test: any) => {
    setInvestigations(investigations.map(i => i.id === id ? {
      ...i,
      testId: test.id,
      testName: test.testName,
      testCode: test.testCode
    } : i));
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

    // Validate mandatory prescription fields if not silent
    if (!silent) {
      const medicineItems = prescriptions.filter(p => p.medicine);
      const hasIncomplete = medicineItems.some(p => 
        (!p.freqM && !p.freqA && !p.freqN) || 
        (!p.duration || p.duration <= 0)
      );

      if (hasIncomplete) {
        setShowValidation(true);
        triggerGlobalToast('Frequency and duration are mandatory for all medications', 'error');
        return false;
      }
    }

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
            const daily = parseFreq(fM) + parseFreq(fA) + parseFreq(fN);
            const multiplier = p.durationUnit === 'weeks' ? 7 : (p.durationUnit === 'months' ? 30 : 1);
            const total = daily * (p.duration || 0) * multiplier;
            return {
              medicineId: p.medicineId,
              medicineName: p.medicine,
              dosage: `${fM}-${fA}-${fN}`,
              duration: `${p.duration} ${p.durationUnit} (Total: ${total} units)`
            };
          }),
          labItems: investigations.filter(i => i.testId).map(i => ({
            testId: i.testId,
            testName: i.testName,
            notes: i.notes || ''
          }))
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
    // Validate mandatory prescription fields
    const medicineItems = prescriptions.filter(p => p.medicine);
    const hasIncomplete = medicineItems.some(p => 
      (!p.freqM && !p.freqA && !p.freqN) || 
      (!p.duration || p.duration <= 0)
    );

    if (hasIncomplete) {
      setShowValidation(true);
      triggerGlobalToast('Frequency and duration are mandatory for all medications', 'error');
      return;
    }

    if (medicineItems.length === 0 && investigations.length === 0) {
      setShowEmptyPrescriptionModal(true);
      return;
    }

    await performComplete();
  };

  const performComplete = async () => {
    if (!appointmentId || !appointment) return;

    // First save the consultation data explicitly to ensure it's persisted in DB
    const isSaved = await saveConsultation(true);
    if (!isSaved) {
      triggerGlobalToast('Failed to save consultation details before completion', 'error');
      return;
    }

    try {
      // Complete Consultation - status update only, data is already saved above
      const statusRes = await appointmentService.completeConsultation(appointmentId!);
      if (statusRes.success) {
        triggerGlobalToast('Consultation completed successfully', 'success');
        router.push('/doctor/dashboard');
      }
    } catch (error) {
      console.error('Failed to complete consultation workflow:', error);
      triggerGlobalToast('Error completing consultation', 'error');
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
                <Button variant="secondary" onClick={() => setShowHistoryModal(true)} icon="history" className="text-xs h-10 font-black">View History</Button>
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

              {/* Right Column: Prescription & Lab Tabs */}
              <div className="col-span-12 lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[700px]">
                  {/* Tab Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6 bg-slate-50/30 rounded-t-2xl">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setActiveTab('meds')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'meds' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <span className="material-symbols-outlined text-lg">medication_liquid</span>
                        Medications
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'meds' ? 'bg-orange-100' : 'bg-slate-200'}`}>
                          {prescriptions.filter(p => p.medicine).length}
                        </span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('labs')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'labs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <span className="material-symbols-outlined text-lg">biotech</span>
                        Investigations
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'labs' ? 'bg-blue-100' : 'bg-slate-200'}`}>
                          {investigations.filter(i => i.testId).length}
                        </span>
                      </button>
                    </div>

                    <button 
                      onClick={activeTab === 'meds' ? addPrescriptionRow : addInvestigationRow}
                      className={`text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 outline-none focus:ring-0 ${activeTab === 'meds' ? 'bg-orange-600 shadow-orange-600/20 hover:bg-orange-700' : 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700'}`}
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      {activeTab === 'meds' ? 'Add Medicine' : 'Add Lab Test'}
                    </button>
                  </div>

                  <div className="p-6 flex-1">
                    {activeTab === 'meds' ? (
                      <div className="space-y-4">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-2 mb-2">
                          <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine Name</div>
                          <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dosage (M-A-N)</div>
                          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Days</div>
                          <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-3">
                          {prescriptions.map((p) => {
                            const hasFreq = p.freqM || p.freqA || p.freqN;
                            const hasDuration = p.duration && p.duration > 0;
                            
                            return (
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
                                <div className={`col-span-8 md:col-span-4 flex items-center gap-1 bg-white border ${showValidation && p.medicine && !hasFreq ? 'border-red-500 animate-pulse' : 'border-slate-200'} rounded-xl p-1 shadow-sm transition-colors`}>
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
                                <div className="col-span-3 md:col-span-2 flex items-center gap-1">
                                  <input
                                    type="number"
                                    className={`w-12 sm:w-16 px-2 py-2 bg-white border ${showValidation && p.medicine && !hasDuration ? 'border-red-500 animate-pulse' : 'border-slate-200'} rounded-lg text-xs font-black text-slate-900 outline-none focus:border-slate-400 text-center shadow-sm transition-colors`}
                                    placeholder="0"
                                    value={p.duration || ''}
                                    onChange={(e) => updatePrescriptionRow(p.id, 'duration', Number.parseInt(e.target.value) || 0)}
                                  />
                                  <select
                                    className="flex-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 h-8 outline-none px-1"
                                    value={p.durationUnit}
                                    onChange={(e) => updatePrescriptionRow(p.id, 'durationUnit', e.target.value)}
                                  >
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                  </select>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  <button onClick={() => removePrescriptionRow(p.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all md:opacity-0 group-hover:opacity-100">
                                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {prescriptions.length === 0 && (
                          <div className="py-24 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                            <span className="material-symbols-outlined text-5xl mb-3 opacity-20">medical_services</span>
                            <p className="text-sm font-bold">No medications added to the plan.</p>
                          </div>
                        )}
                        <div className="mt-8 p-4 bg-orange-600/5 rounded-2xl border border-orange-600/10 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-600/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-orange-600">calculate</span>
                          </div>
                          <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase tracking-tight">
                            Total units will be auto-calculated for pharmacy dispensing. Ensure dosage and duration are accurate.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {investigations.map((i) => (
                            <div key={i.id} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative">
                              <div className="flex items-start gap-4">
                                <div className="flex-1">
                                  <LabTestSearchInput value={i.testName} onChange={() => {}} onSelect={(test) => onSelectInvestigation(i.id, test)} />
                                  {i.testId && (
                                    <div className="mt-3">
                                      <textarea 
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-[11px] font-bold text-slate-600 resize-none h-20 focus:border-blue-300 transition-all shadow-sm"
                                        placeholder="Add specific instructions for this test (e.g., fasting required, preferred time)..."
                                        value={i.notes || ''}
                                        onChange={(e) => updateInvestigationRow(i.id, 'notes', e.target.value)}
                                      />
                                    </div>
                                  )}
                                </div>
                                <button onClick={() => removeInvestigationRow(i.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0">
                                  <span className="material-symbols-outlined text-lg">delete_sweep</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {investigations.length === 0 && (
                          <div className="py-24 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                            <span className="material-symbols-outlined text-5xl mb-3 opacity-20">microscope</span>
                            <p className="text-sm font-bold">No investigations ordered.</p>
                          </div>
                        )}
                        <div className="mt-8 p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-blue-600">info</span>
                          </div>
                          <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-tight">
                            Lab orders will be generated automatically upon completion. Ensure test names are selected correctly.
                          </p>
                        </div>
                      </div>
                    )}
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
          prescriptions={prescriptions.filter(p => p.medicine).map(p => ({
            ...p,
            dosage: `${p.freqM || '0'}-${p.freqA || '0'}-${p.freqN || '0'}`,
            duration: `${p.duration} ${p.durationUnit} (Total: ${calculateTotal(p)} units)`
          }))}
          investigations={investigations.filter(i => i.testId)}
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

      {showEmptyPrescriptionModal && (
        <Modal
          isOpen={showEmptyPrescriptionModal}
          onClose={() => setShowEmptyPrescriptionModal(false)}
          title="Empty Prescription"
          width="360px"
          hideHeader
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <span className="material-symbols-outlined text-3xl">medical_services</span>
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Empty Prescription?</h4>
            <p className="text-xs font-bold text-slate-500 mb-8 leading-relaxed px-2">
              You are completing this consultation without adding any medications. No record will be sent to the pharmacy.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full h-12 font-black shadow-lg shadow-orange-600/20"
                onClick={async () => {
                  setShowEmptyPrescriptionModal(false);
                  await performComplete();
                }}
              >
                Yes, Complete Now
              </Button>
              <Button
                variant="secondary"
                className="w-full h-11 font-black border-none text-slate-400 hover:text-slate-600 bg-transparent"
                onClick={() => setShowEmptyPrescriptionModal(false)}
              >
                Cancel & Go Back
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showHistoryModal && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title={`Consultation History: ${appointment.patientName}`}
          width="800px"
        >
          <div className="flex flex-col h-full font-inter">
            {loadingHistory ? (
              <div className="py-24 text-center">
                <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-bold text-slate-500">Retrieving patient records...</p>
              </div>
            ) : historyList.length === 0 ? (
              <div className="py-24 text-center text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-10">history_off</span>
                <p className="text-sm font-black uppercase tracking-widest">No previous visits recorded.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Carousel Header / Navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Record {currentHistoryIndex + 1} of {historyList.length}</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5">
                      {new Date(historyList[currentHistoryIndex].appointmentTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentHistoryIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentHistoryIndex === 0}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentHistoryIndex === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-md active:scale-95'}`}
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button 
                      onClick={() => setCurrentHistoryIndex(prev => Math.min(historyList.length - 1, prev + 1))}
                      disabled={currentHistoryIndex === historyList.length - 1}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentHistoryIndex === historyList.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-md active:scale-95'}`}
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                  {/* Single Consultation View */}
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-orange-600 text-2xl">person_2</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 leading-none">Dr. {historyList[currentHistoryIndex].doctorName}</h4>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block italic">Consulting Physician</span>
                      </div>
                    </div>

                    {/* Vitals Summary */}
                    <div className="flex flex-wrap gap-2.5 mb-8">
                      {[
                        { label: 'HR', value: historyList[currentHistoryIndex].vitals?.heartRate, unit: 'BPM', icon: 'favorite', color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Temp', value: historyList[currentHistoryIndex].vitals?.temperature, unit: '°F', icon: 'device_thermostat', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Weight', value: historyList[currentHistoryIndex].vitals?.weight, unit: 'kg', icon: 'monitor_weight', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'BP', value: historyList[currentHistoryIndex].vitals?.bloodPressure, unit: '', icon: 'blood_pressure', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'SpO2', value: historyList[currentHistoryIndex].vitals?.oxygenLevel, unit: '%', icon: 'air', color: 'text-cyan-600', bg: 'bg-cyan-50' }
                      ].filter(v => v.value).map((v) => (
                        <div key={v.label} className={`${v.bg} px-3 py-1.5 rounded-xl border border-white/50 shadow-sm flex items-center gap-2`}>
                          <span className={`material-symbols-outlined text-[14px] ${v.color}`}>{v.icon}</span>
                          <span className="text-xs font-black text-slate-700">
                            {v.value}
                            <small className="text-[9px] ml-0.5 opacity-60 uppercase">{v.unit}</small>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">record_voice_over</span> Complaints & Discussion
                          </h5>
                          <p className="text-xs font-bold text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                            {historyList[currentHistoryIndex].chiefComplaints || historyList[currentHistoryIndex].notes || 'No clinical notes provided for this visit.'}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">medical_information</span> Clinical Diagnosis
                          </h5>
                          <div className="bg-orange-600/5 p-4 rounded-2xl border border-orange-600/10">
                            <p className="text-sm font-black text-slate-900">
                              {historyList[currentHistoryIndex].diagnosis || 'No definitive diagnosis recorded.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">medication</span> Prescribed Medications
                          </h5>
                          <div className="space-y-2">
                            {historyList[currentHistoryIndex].prescription?.items && historyList[currentHistoryIndex].prescription.items.length > 0 ? (
                              historyList[currentHistoryIndex].prescription.items.map((med, idx) => (
                                <div key={idx} className="flex flex-col bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-900">{med.medicineName}</span>
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">{med.dosage}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 mt-1 italic">{med.duration}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No medications prescribed</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {historyList[currentHistoryIndex].prescription?.labItems && historyList[currentHistoryIndex].prescription.labItems.length > 0 && (
                          <div>
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">biotech</span> Lab Investigations
                            </h5>
                            <div className="space-y-2">
                              {historyList[currentHistoryIndex].prescription.labItems.map((lab, idx) => (
                                <div key={idx} className="flex flex-col bg-blue-50/30 px-4 py-3 rounded-2xl border border-blue-100/50">
                                  <span className="text-xs font-black text-blue-900 uppercase tracking-tight">{lab.testName}</span>
                                  {lab.notes && (
                                    <span className="text-[10px] font-bold text-slate-500 mt-1 italic opacity-70">Note: {lab.notes}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </MainLayout>
  );
};
