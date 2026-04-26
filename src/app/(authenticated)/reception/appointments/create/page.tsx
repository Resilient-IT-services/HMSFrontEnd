'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter,  } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { DoctorStaffResponse, PatientResponse, SessionInfo } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { DoctorSelector } from '@/components/reception/appointments/DoctorSelector';
import { SessionGrid } from '@/components/reception/appointments/SessionGrid';
import { ConfirmationPanel } from '@/components/reception/appointments/ConfirmationPanel';

const useAppointmentScheduling = () => {
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
        } else if (selectedDate < todayStr) {
          sessions = [];
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
    if (!selectedPatient || !selectedDoctor || !selectedSession) {
      triggerGlobalToast('Please select patient, doctor and a session', 'error');
      return;
    }
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
        triggerGlobalToast('Appointment scheduled successfully', 'success');
        router.push('/reception/appointments');
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
      let label;

      if (i === 0) {
        label = 'Today';
      } else if (i === 1) {
        label = 'Tomorrow';
      } else {
        label = d.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
        });
      }

      return { iso, label, active: iso === selectedDate };
    });
  }, [selectedDate]);

  return {
    doctors, selectedDoctor, setSelectedDoctor, loading,
    patientSearch, setPatientSearch, searchResults,
    selectedPatient, setSelectedPatient, notes, setNotes,
    selectedDate, setSelectedDate, availability, selectedSession, setSelectedSession,
    fetchingAvailability, submitting, handleConfirm, dateOptions, router
  };
};

const AppointmentScheduling = () => {
  const state = useAppointmentScheduling();

  return (
    <MainLayout title="Appointment Scheduling" hideTitle>
      <div className="flex flex-col h-full bg-[#f9f9ff] p-6 gap-6">
        <div className="flex justify-between items-center px-6 py-4 bg-white border border-slate-200 rounded-xl shadow-sm">          <div className="flex items-center space-x-6">
            <h2 className="text-xl font-bold text-slate-900 font-manrope">Appointment Scheduling</h2>

          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg">
                <span className="material-symbols-outlined text-orange-600 text-sm">calendar_today</span>
                <span className="text-xs font-bold text-orange-700">{new Date().toLocaleDateString()}</span>
             </div>
          </div>
        </div>


        <div className="flex flex-1 gap-6 overflow-hidden">          <DoctorSelector
            doctors={state.doctors} 
            selectedDoctor={state.selectedDoctor} 
            onSelectDoctor={state.setSelectedDoctor} 
            loading={state.loading} 
          />
          <SessionGrid 
            fetchingAvailability={state.fetchingAvailability}
            selectedDoctor={state.selectedDoctor}
            availability={state.availability}
            selectedSession={state.selectedSession}
            setSelectedSession={state.setSelectedSession}
            selectedDate={state.selectedDate}
            setSelectedDate={state.setSelectedDate}
            dateOptions={state.dateOptions}
            formatLocalTime={(t) => t}
          />
          <ConfirmationPanel 
            patientSearch={state.patientSearch}
            setPatientSearch={state.setPatientSearch}
            searchResults={state.searchResults}
            selectedPatient={state.selectedPatient}
            setSelectedPatient={state.setSelectedPatient}
            selectedDoctor={state.selectedDoctor}
            selectedSession={state.selectedSession}
            notes={state.notes}
            setNotes={state.setNotes}
            handleConfirm={state.handleConfirm}
            submitting={state.submitting}
            onBack={() => state.router.back()}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default AppointmentScheduling;
