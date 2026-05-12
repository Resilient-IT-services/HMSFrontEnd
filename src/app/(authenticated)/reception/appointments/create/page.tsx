'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { DoctorStaffResponse, PatientResponse, SessionInfo } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { SessionGrid } from '@/components/reception/appointments/SessionGrid';
import { ConfirmationPanel } from '@/components/reception/appointments/ConfirmationPanel';
import Link from 'next/link';

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateSuggestedTime = (session: SessionInfo, date: string) => {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  
  const baseTime = session.nextSuggestedTime || session.startTime;
  
  if (date !== todayStr) return baseTime;

  const [hours, minutes] = baseTime.split(':').map(Number);
  const baseTotalMinutes = hours * 60 + minutes;
  
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Use a 10-minute buffer to ensure the time is in the future even with minor delays
  if (currentTotalMinutes + 10 > baseTotalMinutes) {
    const suggestedTotalMinutes = currentTotalMinutes + 10;
    const h = Math.floor(suggestedTotalMinutes / 60);
    const m = suggestedTotalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  
  return baseTime;
};

export default function AppointmentScheduling() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const preselectedDoctorId = searchParams.get('doctorId');

  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [availability, setAvailability] = useState<SessionInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
  const [editableTime, setEditableTime] = useState<string>('');
  
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(patientSearch, 300);

  // Fetch Doctors
  useEffect(() => {
    doctorService.list(0, 100).then(res => {
      if (res.success && res.data) {
        setDoctors(res.data.content);
        if (preselectedDoctorId) {
          const doc = res.data.content.find(d => d.doctorId === preselectedDoctorId || d.userId === preselectedDoctorId);
          if (doc) setSelectedDoctor(doc);
        } else if (res.data.content.length > 0) {
          setSelectedDoctor(res.data.content[0]);
        }
      }
      setLoadingDoctors(false);
    });
  }, [preselectedDoctorId]);

  // Fetch Preselected Patient
  useEffect(() => {
    if (preselectedPatientId) {
      patientService.get(preselectedPatientId).then(res => {
        if (res.success && res.data) setSelectedPatient(res.data);
      });
    }
  }, [preselectedPatientId]);

  // Fetch Availability
  useEffect(() => {
    if (!selectedDoctor) return;
    setFetchingAvailability(true);
    setSelectedSession(null);
    doctorService.getAvailability(selectedDoctor.doctorId, selectedDate).then(res => {
      if (res.success && res.data) {
        let sessions = res.data.sessions;
        
        // Filter out past sessions
        const now = new Date();
        const todayStr = getLocalDateString(now);
        
        if (selectedDate === todayStr) {
          const currentHHmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          sessions = sessions.filter(s => s.endTime > currentHHmm);
        } else if (selectedDate < todayStr) {
          sessions = [];
        }

        setAvailability(sessions);
      }
      setFetchingAvailability(false);
    });
  }, [selectedDoctor, selectedDate]);

  // Handle Suggested Time
  useEffect(() => {
    if (selectedSession) {
      setEditableTime(calculateSuggestedTime(selectedSession, selectedDate));
    } else {
      setEditableTime('');
    }
  }, [selectedSession, selectedDate]);

  // Patient Search
  useEffect(() => {
    if (debouncedSearch.length > 2) {
      const cleanSearch = debouncedSearch.trim().replace(/^#/, '');
      patientService.list(0, 5, cleanSearch).then(res => {
        if (res.success && res.data) setSearchResults(res.data.content);
      });
    } else setSearchResults([]);
  }, [debouncedSearch]);

  const handleConfirm = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedSession || !editableTime) {
      triggerGlobalToast('Please complete all selections', 'error');
      return;
    }

    // Double check time is in the future if it's today
    const now = new Date();
    const todayStr = getLocalDateString(now);
    if (selectedDate === todayStr) {
      const [h, m] = editableTime.split(':').map(Number);
      const chosenTotalMinutes = h * 60 + m;
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      
      if (chosenTotalMinutes <= currentTotalMinutes) {
        triggerGlobalToast('Please select a time in the future', 'error');
        return;
      }
    }

    const getSessionPeriod = (time: string) => {
      if (time < '12:00') return 'MORNING';
      if (time < '17:00') return 'AFTERNOON';
      return 'EVENING';
    };

    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.doctorId,
        appointmentTime: `${selectedDate}T${editableTime}:00`,
        sessionPeriod: getSessionPeriod(editableTime),
        notes
      });
      router.push(`/reception/billing?${params.toString()}`);
    } catch {
      triggerGlobalToast('Failed to prepare billing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = getLocalDateString(d);
      let label;

      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

      return { iso, label, active: iso === selectedDate };
    });
  }, [selectedDate]);

  return (
    <MainLayout title="Fast-Track Appointment" hideTitle>
      <div className="max-w-6xl mx-auto px-8 py-4 font-inter">
        {/* Compact Page Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-orange-200">
              <span className="material-symbols-outlined text-xl">bolt</span>
            </div>
            <div>
              <h1 className="font-manrope text-2xl font-black text-slate-900 tracking-tight">Fast-Track Appointment</h1>
              <p className="text-slate-500 text-xs font-medium">Instantly book a consultation for today or this week.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-sm">event</span>
            <span className="font-bold text-slate-700 text-xs">Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              
              {/* Patient & Doctor Selection Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Selection */}
                <div>
                  <label htmlFor="patient-search" className="block font-bold text-slate-700 mb-2 flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">person</span>
                      Patient
                    </span>
                    <span className="text-slate-400 text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded tracking-widest">Required</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">person_search</span>
                    <input 
                      id="patient-search"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium" 
                      placeholder="Search patient..." 
                      type="text"
                      value={selectedPatient ? selectedPatient.fullName : patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        if (selectedPatient) setSelectedPatient(null);
                      }}
                    />
                    {searchResults.length > 0 && !selectedPatient && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 mt-1 max-h-48 overflow-y-auto">
                        {searchResults.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedPatient(p)}
                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                            data-testid={`patient-option-${p.id}`}
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{p.fullName}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{p.phone}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor Selection */}
                <div>
                  <label htmlFor="doctor-select" className="block font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-primary text-base">medical_services</span>
                    Doctor
                  </label>
                  <div className="relative">
                    <select 
                      id="doctor-select"
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none text-sm text-slate-900 font-medium"
                      value={selectedDoctor?.doctorId || ''}
                      onChange={(e) => {
                        const doc = doctors.find(d => d.doctorId === e.target.value);
                        if (doc) setSelectedDoctor(doc);
                      }}
                    >
                      <option value="" disabled>Choose doctor...</option>
                      {doctors.map(doc => (
                        <option key={doc.doctorId} value={doc.doctorId}>
                          {doc.fullName} ({doc.specialization})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-50" />

              {/* Availability Slots */}
              <SessionGrid 
                fetchingAvailability={fetchingAvailability}
                selectedDoctor={selectedDoctor}
                availability={availability}
                selectedSession={selectedSession}
                setSelectedSession={setSelectedSession}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                dateOptions={dateOptions}
                formatLocalTime={(t) => t}
                editableTime={editableTime}
                setEditableTime={setEditableTime}
              />


            </div>
          </div>

          {/* Right Column: Visit Summary Sidebar */}
          <div className="col-span-12 lg:col-span-4 sticky top-20">
            <ConfirmationPanel 
              selectedPatient={selectedPatient}
              selectedDoctor={selectedDoctor}
              selectedSession={selectedSession}
              editableTime={editableTime}
              handleConfirm={handleConfirm}
              submitting={submitting}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
