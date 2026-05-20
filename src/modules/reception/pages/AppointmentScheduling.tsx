'use client';

import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { DoctorStaffResponse, PatientResponse, SessionInfo, DoctorSelectionDTO } from '@/types/api';
import { PageHeading } from '@/components/ui/PageHeading';
import { triggerGlobalToast } from '@/components/ui/Toast';

import { useDebounce } from '@/hooks/useDebounce';
import { SessionGrid } from '@/components/reception/appointments/SessionGrid';
import { ConfirmationPanel } from '@/components/reception/appointments/ConfirmationPanel';
import { getPrimarySpecialization } from '@/utils/staffDisplay';
import { getHospitalDayRangeUTC } from '@/utils/dateValidator';
import dayjs from '@/lib/dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

const getLocalDateString = (date: Date | dayjs.Dayjs, tz?: string | null) => {
  return dayjs(date).tz(tz || undefined).format('YYYY-MM-DD');
};

const calculateSuggestedTime = (session: SessionInfo, date: string, tz?: string | null) => {
  const now = dayjs().tz(tz || undefined);
  const todayStr = getLocalDateString(now, tz);
  
  const baseTime = session.nextSuggestedTime || session.startTime;
  
  if (date !== todayStr) return baseTime;

  const [hours, minutes] = baseTime.split(':').map(Number);
  const baseTotalMinutes = hours * 60 + minutes;
  
  const currentTotalMinutes = now.hour() * 60 + now.minute();
  
  // Use a 10-minute buffer to ensure the time is in the future even with minor delays
  if (currentTotalMinutes + 10 > baseTotalMinutes) {
    const suggestedTotalMinutes = currentTotalMinutes + 10;
    const h = Math.floor(suggestedTotalMinutes / 60);
    const m = suggestedTotalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  
  return baseTime;
};

export function AppointmentScheduling() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hospitalTimezone = useSelector((state: RootState) => state.auth.hospitalTimezone);
  
  const preselectedPatientId = searchParams.get('patientId');
  const preselectedDoctorId = searchParams.get('doctorId');

  const [doctors, setDoctors] = useState<DoctorSelectionDTO[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSelectionDTO | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date(), hospitalTimezone));
  const [availability, setAvailability] = useState<SessionInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
  const [editableTime, setEditableTime] = useState<string>('');
  
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(patientSearch, 300);

  // Keep selectedDate in sync with timezone if it changes on mount
  useEffect(() => {
    if (hospitalTimezone) {
      setSelectedDate(getLocalDateString(new Date(), hospitalTimezone));
    }
  }, [hospitalTimezone]);

  const fetchingDoctors = useRef(false);

  // Fetch Doctors Selection
  useEffect(() => {
    if (fetchingDoctors.current) return;
    
    const trigger = async () => {
      fetchingDoctors.current = true;
      try {
        const res = await doctorService.getDoctorsSelection();
        if (res.success && res.data) {
          setDoctors(res.data);
          
          // Auto-select doctor logic
          if (preselectedDoctorId) {
            const doc = res.data.find(d => d.id === preselectedDoctorId);
            if (doc) setSelectedDoctor(doc);
          } else if (res.data.length > 0 && !selectedDoctor) {
            setSelectedDoctor(res.data[0]);
          }
        }
      } finally {
        setLoadingDoctors(false);
        fetchingDoctors.current = false;
      }
    };
    void trigger();
  }, [preselectedDoctorId, selectedDoctor]); // Added selectedDoctor check to prevent clearing manually set doctor

  // Fetch Preselected Patient
  useEffect(() => {
    const trigger = async () => {
      if (preselectedPatientId) {
        const res = await patientService.get(preselectedPatientId);
        if (res.success && res.data) setSelectedPatient(res.data);
      }
    };
    void trigger();
  }, [preselectedPatientId]);

  const availabilityCallRef = useRef<string>('');

  // Fetch Availability
  useEffect(() => {
    const trigger = async () => {
      if (!selectedDoctor || !hospitalTimezone) return;
      
      const callKey = `${selectedDoctor.id}-${selectedDate}`;
      
      // Prevent duplicate calls for the same parameters
      if (availabilityCallRef.current === callKey) return;
      
      availabilityCallRef.current = callKey;
      setFetchingAvailability(true);
      setSelectedSession(null);
      
      try {
        const res = await doctorService.getAvailability(selectedDoctor.id, selectedDate);
        if (res.success && res.data) {
          let sessions = res.data.sessions;
          
          // Filter out past sessions
          const now = dayjs().tz(hospitalTimezone);
          const todayStr = getLocalDateString(now, hospitalTimezone);
          
          if (selectedDate === todayStr) {
            const currentHHmm = now.format('HH:mm');
            sessions = sessions.filter(s => s.endTime > currentHHmm);
          } else if (selectedDate < todayStr) {
            sessions = [];
          }

          setAvailability(sessions);
        }
      } finally {
        setFetchingAvailability(false);
      }
    };
    void trigger();
  }, [selectedDoctor?.id, selectedDate, hospitalTimezone]);

  // Handle Suggested Time
  useEffect(() => {
    const trigger = async () => {
      if (selectedSession) {
        setEditableTime(calculateSuggestedTime(selectedSession, selectedDate, hospitalTimezone));
      } else {
        setEditableTime('');
      }
    };
    void trigger();
  }, [selectedSession, selectedDate, hospitalTimezone]);

  // Patient Search
  useEffect(() => {
    const trigger = async () => {
      if (debouncedSearch.length > 2) {
        const res = await patientService.list(0, 5, debouncedSearch);
        if (res.success && res.data) setSearchResults(res.data.content);
      } else setSearchResults([]);
    };
    void trigger();
  }, [debouncedSearch]);

  const handleConfirm = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedSession || !editableTime || !hospitalTimezone) {
      triggerGlobalToast('Please complete all selections', 'error');
      return;
    }

    // Double check time is in the future if it's today
    const now = dayjs().tz(hospitalTimezone);
    const todayStr = getLocalDateString(now, hospitalTimezone);
    if (selectedDate === todayStr) {
      const [h, m] = editableTime.split(':').map(Number);
      const chosen = now.hour(h).minute(m).second(0).millisecond(0);
      
      if (!chosen.isAfter(now)) {
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
      const appointmentTime = dayjs(`${selectedDate}T${editableTime}`).tz(hospitalTimezone, true).toISOString();
      const { from, to } = getHospitalDayRangeUTC(hospitalTimezone, selectedDate);
      
      // Quick check for existing appointment to prevent duplicates and enable resume
      const res = await appointmentService.list(0, 50, undefined, from, to, selectedDoctor.id);
      if (res.success && res.data) {
        const existing = res.data.content.find(a => 
          a.patientId === selectedPatient.id && 
          a.appointmentTime === appointmentTime &&
          a.status !== 'CANCELLED'
        );
        if (existing) {
          triggerGlobalToast('Existing appointment found. Redirecting...', 'warning');
          router.push(`/reception/billing?appointmentId=${existing.id}`);
          return;
        }
      }

      const params = new URLSearchParams({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.id,
        appointmentTime: appointmentTime,
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
      const d = dayjs().tz(hospitalTimezone || undefined).add(i, 'day');
      const iso = getLocalDateString(d, hospitalTimezone);
      let label;

      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else label = d.format('ddd, MMM D');

      return { iso, label, active: iso === selectedDate };
    });
  }, [selectedDate, hospitalTimezone]);

  return (
    <MainLayout title="Fast-Track Appointment" hideTitle>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 font-inter pb-20 sm:pb-8">
        {/* Compact Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-orange-200">
              <span className="material-symbols-outlined text-xl">bolt</span>
            </div>
            <div>
              <h1 className="font-manrope text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Fast-Track Appointment</h1>
              <p className="text-slate-500 text-[10px] sm:text-xs font-medium">Instantly book a consultation for today or this week.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm self-start sm:self-auto">
            <span className="material-symbols-outlined text-slate-400 text-sm">event</span>
            <span className="font-bold text-slate-700 text-[10px] sm:text-xs">Today, {dayjs().tz(hospitalTimezone || undefined).format('MMM D')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
              
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
                              <p className="text-[10px] text-slate-500 font-medium">
                                {p.patientCode || 'N/A'} • {p.phone}
                              </p>
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
                      value={selectedDoctor?.id || ''}
                      onChange={(e) => {
                        const doc = doctors.find(d => d.id === e.target.value);
                        if (doc) setSelectedDoctor(doc);
                      }}
                    >
                      <option value="" disabled>Choose doctor...</option>
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>
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
                selectedDoctor={selectedDoctor as any}
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
          <div className="lg:col-span-4 lg:sticky lg:top-20">
            <ConfirmationPanel 
              selectedPatient={selectedPatient}
              selectedDoctor={selectedDoctor as any}
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
