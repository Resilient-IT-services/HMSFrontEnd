'use client';

import React, {useEffect, useState, useMemo} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { DoctorStaffResponse, PatientResponse, SessionInfo } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import dayjs from '@/lib/dayjs';
import { SessionGrid } from '@/components/reception/appointments/SessionGrid';
import { ConfirmationPanel } from '@/components/reception/appointments/ConfirmationPanel';
import { PageSurface } from '@/components/ui/PageSurface';

export default function AppointmentScheduling() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hospitalTimezone } = useSelector((state: RootState) => state.auth);
  
  // URL Pre-load Logic
  const patientIdParam = searchParams.get('patientId');
  const doctorIdParam = searchParams.get('doctorId');

  // Form State
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  
  const [availability, setAvailability] = useState<SessionInfo[]>([]);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [editableTime, setEditableTime] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  // Date Selection Range (Next 7 days)
  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
        const d = dayjs().add(i, 'day');
        return {
            iso: d.format('YYYY-MM-DD'),
            label: i === 0 ? 'Today' : d.format('ddd'),
            active: d.format('YYYY-MM-DD') === selectedDate
        };
    });
  }, [selectedDate]);

  // 1. Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const docRes = await doctorService.list({ page: 0, size: 50 });
        if (docRes.success && docRes.data) {
          setDoctors(docRes.data.content);
          if (doctorIdParam) {
            const preSelected = docRes.data.content.find(d => d.doctorId === doctorIdParam || d.userId === doctorIdParam);
            if (preSelected) setSelectedDoctor(preSelected);
          }
        }

        if (patientIdParam) {
          const patRes = await patientService.get(patientIdParam);
          if (patRes.success && patRes.data) setSelectedPatient(patRes.data);
        }
      } catch (error) {
        console.error('Initialization failed', error);
      }
    };
    void init();
  }, [doctorIdParam, patientIdParam]);

  // 2. Patient Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (patientSearch.length >= 3 && !selectedPatient) {
        const res = await patientService.list({ page: 0, size: 5, search: patientSearch });
        if (res.success && res.data) setSearchResults(res.data.content);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearch, selectedPatient]);

  // 3. Availability Fetch Logic
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctor) {
        setAvailability([]);
        return;
      }

      setFetchingAvailability(true);
      try {
        const res = await doctorService.getAvailability(selectedDoctor.doctorId, selectedDate);
        if (res.success && res.data) {
          setAvailability(res.data.sessions || []);
          // Auto-select first available session if none selected or date changed
          if (res.data.sessions.length > 0) {
             const firstFree = res.data.sessions.find(s => s.available);
             if (firstFree) {
                setSelectedSession(firstFree);
                setEditableTime(firstFree.nextSuggestedTime || firstFree.startTime);
             }
          }
        }
      } catch (error) {
        console.error('Failed to fetch availability', error);
      } finally {
        setFetchingAvailability(false);
      }
    };
    void fetchSlots();
  }, [selectedDoctor, selectedDate]);

  const handleSessionSelect = (session: SessionInfo) => {
    setSelectedSession(session);
    setEditableTime(session.startTime);
  };

  const handleConfirm = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedSession || !editableTime) {
      triggerGlobalToast('Please complete all selection steps', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      
      // Construct the exact ISO string based on selected date and editable time
      const [hours, minutes] = editableTime.split(':');
      const appointmentTime = dayjs(selectedDate)
        .hour(Number.parseInt(hours))
        .minute(Number.parseInt(minutes))
        .second(0)
        .millisecond(0)
        .toISOString();

      const payload = {
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.doctorId,
        appointmentTime: appointmentTime,
        notes: 'Walk-in OP Consultation'
      };

      const res = await appointmentService.create(payload as any);
      if (res.success && res.data) {
        triggerGlobalToast('Appointment scheduled successfully!', 'success');
        // Navigate to billing
        router.push(`/reception/billing?appointmentId=${res.data.id}`);
      }
    } catch (error) {
      console.error('Scheduling failed', error);
      triggerGlobalToast('Critical error during scheduling', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout title="Fast-Track Appointment" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          {/* Compact Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-200">
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
                        <span className="material-symbols-outlined text-orange-600 text-base">person</span>
                        Patient
                      </span>
                      <span className="text-slate-400 text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded tracking-widest">Required</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">person_search</span>
                      <input 
                        id="patient-search"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium" 
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
                      <span className="material-symbols-outlined text-orange-600 text-base">medical_services</span>
                      Doctor
                    </label>
                    <div className="relative">
                      <select 
                        id="doctor-select"
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 appearance-none text-sm text-slate-900 font-medium"
                        value={selectedDoctor?.doctorId || ''}
                        onChange={(e) => {
                          const doc = doctors.find(d => d.doctorId === e.target.value);
                          if (doc) setSelectedDoctor(doc);
                        }}
                      >
                        <option value="" disabled>Choose doctor...</option>
                        {doctors.map(doc => (
                          <option key={doc.doctorId} value={doc.doctorId}>
                            {doc.fullName} ({doc.specializations?.[0] || 'General'})
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
                  onSessionSelect={handleSessionSelect}
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
      </PageSurface>
    </MainLayout>
  );
}
