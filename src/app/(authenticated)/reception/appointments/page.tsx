'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { DoctorStaffResponse, PatientResponse, SessionInfo } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';
import { DoctorSelector } from '@/components/reception/appointments/DoctorSelector';
import { SessionGrid } from '@/components/reception/appointments/SessionGrid';
import { ConfirmationPanel } from '@/components/reception/appointments/ConfirmationPanel';

const AppointmentSchedulingPage = () => {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<SessionInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(patientSearch, 300);

  useEffect(() => {
    doctorService.list(0, 50).then(res => {
      if (res.success && res.data) {
        setDoctors(res.data.content);
        if (res.data.content.length > 0 && !selectedDoctor) setSelectedDoctor(res.data.content[0]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedDoctor) return;
    setFetchingAvailability(true);
    setSelectedSession(null);
    doctorService.getAvailability(selectedDoctor.userId, selectedDate).then(res => {
      if (res.success && res.data) {
        let sessions = res.data.sessions;
        
        // Filter out past sessions
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        if (selectedDate === todayStr) {
          const currentHHmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          sessions = sessions.filter(s => s.endTime > currentHHmm);
        }

        setAvailability(sessions);
      }
      setFetchingAvailability(false);
    });
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    if (debouncedSearch.length > 2) {
      patientService.list(0, 5, debouncedSearch).then(res => {
        if (res.success && res.data) setSearchResults(res.data.content);
      });
    } else setSearchResults([]);
  }, [debouncedSearch]);

  const handleConfirm = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedSession) return;
    setSubmitting(true);
    try {
      const timeToUse = selectedSession.nextSuggestedTime || selectedSession.startTime;
      const res = await appointmentService.create({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.userId,
        appointmentTime: `${selectedDate}T${timeToUse}:00`,
        notes
      });
      if (res.success) {
        router.push('/reception/appointments/success'); // Or somewhere else
      }
    } finally {
      setSubmitting(false);
    }
  };

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      return { iso, label, active: iso === selectedDate };
    });
  }, [selectedDate]);

  return (
    <MainLayout title="Appointment Scheduling" hideTitle>
      <div className="flex flex-col h-[calc(100vh-64px)] -m-gutter overflow-hidden bg-[#f9f9fb] max-w-none w-[calc(100%+2*var(--spacing-gutter))]">
        {/* Header matching HTML */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Appointment Scheduling</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input className="bg-slate-100 border-none rounded-full py-1.5 pl-9 pr-4 text-sm w-64 focus:ring-2 focus:ring-primary/20 outline-none font-medium" placeholder="Search..." type="text"/>
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"><span className="material-symbols-outlined">notifications</span></button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"><span className="material-symbols-outlined">settings</span></button>
          </div>
        </header>

        {/* 3-Column Layout Area matching HTML */}
        <div className="flex flex-1 overflow-hidden p-4 lg:p-6 gap-4 lg:gap-6">
          <DoctorSelector 
            doctors={doctors} 
            selectedDoctor={selectedDoctor} 
            onSelectDoctor={setSelectedDoctor} 
            loading={loading} 
          />
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
          />
          <ConfirmationPanel 
            patientSearch={patientSearch}
            setPatientSearch={setPatientSearch}
            searchResults={searchResults}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            selectedDoctor={selectedDoctor}
            selectedSession={selectedSession}
            notes={notes}
            setNotes={setNotes}
            handleConfirm={handleConfirm}
            submitting={submitting}
            onBack={() => {
              setSelectedPatient(null);
              setSelectedSession(null);
              setNotes('');
            }}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default AppointmentSchedulingPage;