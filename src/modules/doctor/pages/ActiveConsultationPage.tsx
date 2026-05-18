'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { hospitalService } from '@/services/hospitalService';
import { pharmacyService } from '@/services/pharmacyService';
import { AppointmentResponse, PatientResponse, HospitalResponse, MedicineResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken } from '@/utils/tokenHelper';
import DigitalPrescription from '@/components/doctor/DigitalPrescription';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';

const MedicineSearchInput = ({ 
  value, 
  onChange, 
  onSelect,
  inStock = true
}: { 
  value: string; 
  onChange: (val: string) => void;
  onSelect: (med: MedicineResponse) => void;
  inStock?: boolean;
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [results, setResults] = useState<MedicineResponse[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const fetchMedicines = async () => {
      if (debouncedSearch.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await pharmacyService.listMedicines({ search: debouncedSearch, size: 5 });
        if (res.success && res.data) {
          setResults(res.data.content);
        }
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
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
        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all ${
          !inStock ? 'border-red-200 text-red-900 pr-16' : 'border-slate-200 text-slate-900'
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
      
      {!inStock && !showResults && searchTerm && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-red-600 uppercase tracking-tighter bg-red-50 px-1.5 py-0.5 rounded border border-red-100 pointer-events-none">
          No Stock
        </span>
      )}

      {showResults && (searchTerm.length >= 2 || results.length > 0) && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
          {loading && <div className="p-3 text-xs text-slate-400 font-bold italic">Searching...</div>}
          {!loading && results.length === 0 && searchTerm.length >= 2 && (
            <div className="p-3 text-xs text-slate-400 font-bold">No matches found. Using manual entry.</div>
          )}
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
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black ${
                    (med.currentStock || 0) > 0 
                      ? 'text-emerald-600' 
                      : 'text-red-600'
                  }`}>
                    {med.currentStock || 0}
                  </span>
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">STK</span>
                </div>
                {med.form && <span className="text-[8px] text-slate-400 font-bold mt-0.5 uppercase">{med.form}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

  // Consultation State
  const [complaints, setComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;
    try {
      setLoading(true);
      const res = await appointmentService.get(appointmentId);
      if (res.success && res.data) {
        setAppointment(res.data);
        setComplaints(res.data.chiefComplaints || '');
        setDiagnosis(res.data.diagnosis || '');
        
        if (res.data.prescription?.items) {
          setPrescriptions(res.data.prescription.items.map((item, idx) => ({
            id: item.id || `existing-${idx}`,
            medicine: item.medicineName,
            frequency: item.dosage,
            instructions: item.duration,
            inStock: true // Default for existing items
          })));
        } else {
          setPrescriptions([{ id: '1', medicine: '', frequency: '', instructions: '', inStock: true }]);
        }

        const pRes = await patientService.get(res.data.patientId);
        if (pRes.success && pRes.data) {
          setPatient(pRes.data);
        }

        if (user?.currentHospitalId) {
          const hRes = await hospitalService.getById(user.currentHospitalId);
          if (hRes.success && hRes.data) {
            setHospital(hRes.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
      triggerGlobalToast('Failed to fetch appointment details', 'error');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, user?.currentHospitalId]);

  useEffect(() => {
    const trigger = async () => {
      await fetchAppointment();
    };
    void trigger();
  }, [fetchAppointment]);

  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { 
      id: Date.now().toString(), 
      medicine: '', 
      frequency: '', 
      instructions: '',
      inStock: true
    }]);
  };

  const removePrescriptionRow = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const updatePrescriptionRow = (id: string, field: string, value: string) => {
    setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const selectMedicine = (id: string, med: MedicineResponse) => {
    setPrescriptions(prescriptions.map(p => p.id === id ? { 
      ...p, 
      medicine: med.name,
      inStock: (med.currentStock || 0) > 0,
      composition: med.composition
    } : p));
  };

  const saveConsultation = async (silent = false) => {
    if (!appointmentId || !appointment) return false;
    try {
      const updateData = {
        chiefComplaints: complaints,
        diagnosis: diagnosis,
        prescription: {
          appointmentId: appointmentId,
          patientId: appointment.patientId,
          items: prescriptions.filter(p => p.medicine).map(p => ({
            medicineName: p.medicine,
            dosage: p.frequency,
            duration: p.instructions
          }))
        }
      };
      
      const res = await appointmentService.updateConsultation(appointmentId, updateData as any);
      if (res.success && !silent) {
        triggerGlobalToast('Progress saved successfully', 'success');
      }
      return res.success;
    } catch (error) {
      console.error('Failed to save consultation:', error);
      if (!silent) triggerGlobalToast('Failed to save progress', 'error');
      return false;
    }
  };

  const handleComplete = async () => {
    const saved = await saveConsultation(true);
    if (!saved) {
      triggerGlobalToast('Failed to save consultation details. Cannot complete.', 'error');
      return;
    }

    try {
      const statusRes = await appointmentService.updateStatus(appointmentId!, { status: 'COMPLETED' });
      if (statusRes.success) {
        triggerGlobalToast('Consultation completed successfully', 'success');
        router.push('/doctor/dashboard');
      }
    } catch (error) {
      console.error('Failed to complete consultation:', error);
      triggerGlobalToast('Failed to complete consultation', 'error');
    }
  };

  if (loading) return <MainLayout title="Active Consultation">Loading...</MainLayout>;
  if (!appointment) return <MainLayout title="Active Consultation">Appointment not found</MainLayout>;

  return (
    <MainLayout title={`Consultation: ${appointment.patientName}`}>
      <div className="flex flex-col h-full">
        {/* Header - Patient Info & Actions */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{appointment.patientName}</h2>
              <span className="bg-orange-600/10 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded border border-orange-600/20 uppercase tracking-widest">
                {formatToken(appointment)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-sm mt-2 font-medium">
              <span>{patient?.gender}</span>
              <span>•</span>
              <span>{appointment.patientAge || '--'} Yrs</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="material-symbols-outlined text-sm">event</span>
                {new Date(appointment.appointmentTime).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="secondary"
              onClick={() => saveConsultation()}
              icon="save"
              className="hidden sm:flex"
            >
              Save Progress
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setShowPreview(true)}
              icon="visibility"
              className="flex-1 sm:flex-none"
            >
              Preview Prescription
            </Button>
            <Button 
              onClick={handleComplete}
              icon="task_alt"
              className="flex-1 sm:flex-none shadow-lg shadow-orange-600/20"
            >
              Complete Consultation
            </Button>
          </div>
        </div>


        {/* Main Content Area */}
        <div className="flex-1 bg-slate-50 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-12 gap-6">
              
              {/* Left Column: Complaints & Diagnosis */}
              <div className="col-span-12 lg:col-span-6 space-y-6">
                
                {/* Vitals Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-6 items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Heart Rate</span>
                    <div className="flex items-center gap-1.5 text-orange-600">
                      <span className="material-symbols-outlined text-sm">favorite</span>
                      <span className="font-bold text-lg leading-none">{appointment.vitals?.heartRate || '--'} <span className="text-[10px] text-slate-400">BPM</span></span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Temperature</span>
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <span className="material-symbols-outlined text-sm">device_thermostat</span>
                      <span className="font-bold text-lg leading-none">{appointment.vitals?.temperature || '--'} <span className="text-[10px] text-slate-400">°F</span></span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Blood Pressure</span>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <span className="material-symbols-outlined text-sm">blood_pressure</span>
                      <span className="font-bold text-lg leading-none">{appointment.vitals?.bloodPressure || '--'}</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">SpO2</span>
                    <div className="flex items-center gap-1.5 text-purple-600">
                      <span className="material-symbols-outlined text-sm">air</span>
                      <span className="font-bold text-lg leading-none">{appointment.vitals?.oxygenLevel || '--'} <span className="text-[10px] text-slate-400">%</span></span>
                    </div>
                  </div>
                </div>

                {/* Complaint Input */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600">record_voice_over</span>
                      Patient Complaint
                    </h3>
                  </div>
                  <textarea
                    className="w-full min-h-[180px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-slate-700 resize-none outline-none"
                    placeholder="Describe patient symptoms and chief complaints..."
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                  />
                </div>

                {/* Diagnosis Input */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600">medical_information</span>
                      Diagnosis
                    </h3>
                  </div>
                  <textarea
                    className="w-full min-h-[180px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-bold text-slate-900 text-lg resize-none outline-none"
                    placeholder="Enter clinical diagnosis and assessment..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>
              </div>

              {/* Right Column: Medications */}
              <div className="col-span-12 lg:col-span-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full flex flex-col min-h-[600px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600">description</span>
                      Medication Plan
                    </h3>
                    <button 
                      onClick={addPrescriptionRow}
                      className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-orange-700 transition-colors bg-orange-600/5 px-3 py-2 rounded-lg border border-orange-600/10"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Medicine
                    </button>
                  </div>

                  <div className="flex-1">
                    {/* Table Header - Only visible on sm screens and up */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-4 mb-2">
                      <div className="col-span-5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medicine Name</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Frequency</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                      </div>
                      <div className="col-span-1"></div>
                    </div>

                    <div className="space-y-2">
                      {prescriptions.map((p) => (
                        <div key={p.id} className={`grid grid-cols-12 gap-2 p-2 sm:px-4 sm:py-2 border rounded-xl group relative items-center transition-all ${
                          !p.inStock ? 'bg-red-50/50 border-red-100 shadow-sm shadow-red-500/5' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <div className="col-span-12 sm:col-span-5">
                            <label className="sm:hidden block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Medicine Name</label>
                            <MedicineSearchInput 
                              value={p.medicine} 
                              inStock={p.inStock}
                              onChange={(val) => updatePrescriptionRow(p.id, 'medicine', val)}
                              onSelect={(med) => selectMedicine(p.id, med)}
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-3">
                            <label className="sm:hidden block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Frequency</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                              placeholder="1-0-1"
                              value={p.frequency}
                              onChange={(e) => updatePrescriptionRow(p.id, 'frequency', e.target.value)}
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-3">
                            <label className="sm:hidden block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                              placeholder="5 days"
                              value={p.instructions}
                              onChange={(e) => updatePrescriptionRow(p.id, 'instructions', e.target.value)}
                            />
                          </div>
                          
                          <div className="col-span-12 sm:col-span-1 flex justify-end sm:justify-center">
                            <button 
                              onClick={() => removePrescriptionRow(p.id)}
                              className="sm:opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"
                              title="Remove"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {prescriptions.length === 0 && (

                      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-20">prescriptions</span>
                        <p className="text-sm font-medium">No medications prescribed yet.</p>
                        <button onClick={addPrescriptionRow} className="text-xs font-black text-orange-600 mt-3 uppercase tracking-widest hover:underline">+ Start Prescription</button>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="bg-orange-600/5 p-4 rounded-xl border border-orange-600/10 flex items-start gap-3">
                      <span className="material-symbols-outlined text-orange-600">info</span>
                      <p className="text-xs font-medium text-orange-800 leading-relaxed">
                        Completing this consultation will automatically generate an invoice for the patient and mark the appointment as finished.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Preview Modal */}
      {showPreview && (
        <DigitalPrescription
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          patient={patient}
          doctor={user}
          hospital={hospital}
          complaints={complaints}
          diagnosis={diagnosis}
          prescriptions={prescriptions.filter(p => p.medicine)}
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

