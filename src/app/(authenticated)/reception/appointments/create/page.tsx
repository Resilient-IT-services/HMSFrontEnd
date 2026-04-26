'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { DoctorStaffResponse, PatientResponse, SessionInfo, LocalTime } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';

const AppointmentScheduling = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [notes, setNotes] = useState('');
  
  // New Availability State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<SessionInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(patientSearch, 300);

  // Initial fetch of doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await doctorService.list(0, 50);
        if (res.success && res.data) {
          setDoctors(res.data.content);
          // Auto-select first doctor if none selected
          if (res.data.content.length > 0 && !selectedDoctor) {
            setSelectedDoctor(res.data.content[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch availability when doctor or date changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDoctor) return;
      
      try {
        setFetchingAvailability(true);
        setSelectedSession(null);
        const res = await doctorService.getAvailability(selectedDoctor.userId, selectedDate);
        if (res.success && res.data) {
          setAvailability(res.data.sessions);
        }
      } catch (err) {
        console.error('Failed to fetch availability', err);
        setAvailability([]);
      } finally {
        setFetchingAvailability(false);
      }
    };
    fetchAvailability();
  }, [selectedDoctor, selectedDate]);

  // Patient search
  useEffect(() => {
    if (debouncedSearch.length > 2) {
      patientService.list(0, 5, debouncedSearch).then(res => {
        if (res.success && res.data) {
          setSearchResults(res.data.content);
        }
      });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const formatLocalTime = (lt: LocalTime) => {
    const h = lt.hour.toString().padStart(2, '0');
    const m = lt.minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleConfirm = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedSession) {
      triggerGlobalToast('Please select patient, doctor and a session', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const timeToUse = selectedSession.nextSuggestedTime || selectedSession.startTime;
      const formattedTime = `${timeToUse.hour.toString().padStart(2, '0')}:${timeToUse.minute.toString().padStart(2, '0')}:00`;

      const res = await appointmentService.create({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.userId,
        appointmentTime: `${selectedDate}T${formattedTime}`,
        notes: notes
      });

      if (res.success) {
        triggerGlobalToast('Appointment scheduled successfully', 'success');
        router.push('/reception/appointments');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate date options for the next 7 days
  const dateOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      options.push({ iso, label, active: iso === selectedDate });
    }
    return options;
  }, [selectedDate]);

  return (
    <MainLayout title="Appointment Scheduling" hideTitle>
      <div className="flex flex-col h-screen -m-8 overflow-hidden bg-[#f9f9ff]">
        {/* Top Navigation */}
        <header className="flex justify-between items-center px-8 py-4 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-40">
          <div className="flex items-center space-x-6">
            <h2 className="text-xl font-bold text-slate-900 font-manrope">Appointment Scheduling</h2>
            <div className="relative w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-orange-500 transition-all outline-none" 
                placeholder="Quick search doctor..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg">
                <span className="material-symbols-outlined text-orange-600 text-sm">calendar_today</span>
                <span className="text-xs font-bold text-orange-700">{new Date().toLocaleDateString()}</span>
             </div>
          </div>
        </header>

        {/* Split Content Area */}
        <div className="flex flex-1 overflow-hidden p-6 gap-6">
          {/* Left: Doctor List */}
          <section className="w-1/3 flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Physician</h3>
              <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded-full text-slate-600 uppercase">Available Today</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {doctors.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc)}
                  className={`bg-white p-4 rounded-2xl border-2 transition-all cursor-pointer group ${selectedDoctor?.id === doc.id ? 'border-orange-600 shadow-md ring-4 ring-orange-600/5' : 'border-slate-100 hover:border-orange-200'}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-colors ${selectedDoctor?.id === doc.id ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-100'}`}>
                      {doc.fullName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900">{doc.fullName}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{doc.specialization}</p>
                      <div className="mt-3 flex items-center justify-between">
                         <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <span className="text-[10px] font-bold text-green-600 uppercase">Available</span>
                         </div>
                         <span className="text-[10px] font-bold text-slate-400">Next: 10:30 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {doctors.length === 0 && !loading && (
                <p className="text-center text-xs text-slate-400 py-12 italic bg-white rounded-2xl border border-dashed border-slate-200">No physicians found in directory.</p>
              )}
            </div>
          </section>

          {/* Middle: Session Grid */}
          <section className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h4 className="font-manrope text-lg font-black text-slate-900">Session Availability</h4>
                <p className="text-xs text-slate-500 font-medium">Select a slot from the doctor's active sessions.</p>
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {dateOptions.map(opt => (
                  <button 
                    key={opt.iso}
                    onClick={() => setSelectedDate(opt.iso)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${opt.active ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Content */}
            <div className="flex-1 overflow-y-auto p-8">
               {fetchingAvailability ? (
                 <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying schedule...</p>
                 </div>
               ) : !selectedDoctor ? (
                 <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">stethoscope</span>
                    <p className="text-sm font-bold text-slate-400">Select a physician from the list to view their daily sessions.</p>
                 </div>
               ) : availability.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                    <span className="material-symbols-outlined text-5xl text-orange-200 mb-4">event_busy</span>
                    <p className="text-sm font-bold text-slate-400">No active sessions found for Dr. {selectedDoctor.fullName} on this date.</p>
                    <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="mt-4 text-xs font-black text-orange-600 uppercase hover:underline">Check Today</button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availability.map((session, idx) => (
                      <div 
                        key={idx}
                        onClick={() => session.available && setSelectedSession(session)}
                        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                          selectedSession === session ? 'border-orange-600 bg-orange-50/30' : 
                          !session.available ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed' : 
                          'border-slate-100 hover:border-orange-200 bg-white'
                        }`}
                      >
                        <div className="relative z-10 flex justify-between items-start mb-6">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="material-symbols-outlined text-lg text-orange-600">alarm</span>
                                 <h5 className="font-manrope font-black text-slate-900 text-lg">
                                    {formatLocalTime(session.startTime)} - {formatLocalTime(session.endTime)}
                                 </h5>
                              </div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Consultation Session</p>
                           </div>
                           <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${session.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {session.available ? 'Available' : 'Session Full'}
                           </span>
                        </div>

                        <div className="relative z-10 space-y-4">
                           <div className="flex items-end justify-between">
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Capacity Status</p>
                                 <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-slate-900">{session.currentBookings}</span>
                                    <span className="text-sm font-bold text-slate-300">/ {session.maxPatients} patients</span>
                                 </div>
                              </div>
                              {session.nextSuggestedTime && session.available && (
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-orange-600 uppercase mb-1">Next Slot</p>
                                   <p className="text-sm font-black text-orange-700">{formatLocalTime(session.nextSuggestedTime)}</p>
                                </div>
                              )}
                           </div>
                           
                           {/* Simple Progress Bar */}
                           <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${session.available ? 'bg-orange-500' : 'bg-slate-300'}`}
                                style={{ width: `${(session.currentBookings / session.maxPatients) * 100}%` }}
                              ></div>
                           </div>
                        </div>
                        
                        {/* Selected Icon Overlay */}
                        {selectedSession === session && (
                          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white">
                             <span className="material-symbols-outlined text-2xl -translate-x-2 -translate-y-2">check</span>
                          </div>
                        )}
                      </div>
                    ))}
                 </div>
               )}
            </div>

            {/* Footer Summary Bar */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/20"></span>
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Active Slot</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Full / Blocked</span>
                </div>
              </div>
              {selectedSession && (
                <div className="flex items-center gap-3">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Selected Appointment Window</p>
                      <p className="text-xs font-black text-slate-900">{formatLocalTime(selectedSession.startTime)} - {formatLocalTime(selectedSession.endTime)}</p>
                   </div>
                   <div className="w-px h-8 bg-slate-200 mx-2"></div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-orange-600 uppercase">Suggested Time</p>
                      <p className="text-sm font-black text-orange-700">{selectedSession.nextSuggestedTime ? formatLocalTime(selectedSession.nextSuggestedTime) : formatLocalTime(selectedSession.startTime)}</p>
                   </div>
                </div>
              )}
            </div>
          </section>

          {/* Right: Confirmation Panel */}
          <section className="w-80 flex flex-col space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col h-full overflow-y-auto">
              <h3 className="font-manrope text-xl font-black text-slate-900 mb-8 tracking-tight">Confirm Visit</h3>
              <div className="space-y-8 flex-1">
                {/* Patient Search */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Search Patient Database</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person_search</span>
                    <input 
                      className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" 
                      placeholder="Patient Name or Phone" 
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                  </div>
                  
                  {searchResults.length > 0 && !selectedPatient && (
                    <div className="mt-2 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xl z-50 absolute w-[calc(100%-4rem)]">
                      {searchResults.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => setSelectedPatient(p)}
                          className="p-4 hover:bg-orange-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3"
                        >
                           <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                              {p.fullName[0]}
                           </div>
                           <div>
                            <p className="text-xs font-bold text-slate-900">{p.fullName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{p.phone}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPatient && (
                    <div className="mt-4 bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-center justify-between animate-in zoom-in-95">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-sm">
                          {selectedPatient.fullName[0]}
                        </div>
                        <div className="text-xs">
                          <p className="font-black text-slate-900">{selectedPatient.fullName}</p>
                          <p className="text-[10px] text-slate-600 font-medium">{selectedPatient.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-lg">cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Visit Logic Summary */}
                <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Consultant</span>
                    <span className="text-[11px] font-black text-slate-900 truncate max-w-[120px]">{selectedDoctor?.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Service</span>
                    <span className="text-[11px] font-black text-orange-600 uppercase tracking-tighter">Out-Patient (OPD)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Allocation</span>
                    <span className="text-[11px] font-black text-slate-900">Standard Visit</span>
                  </div>
                </div>

                {/* Internal Memo */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Clinical Notes / Memo</label>
                  <textarea 
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none min-h-[120px] font-medium" 
                    placeholder="Brief reason for visit..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 mt-auto space-y-4">
                <button 
                  onClick={handleConfirm}
                  disabled={submitting || !selectedPatient || !selectedDoctor || !selectedSession}
                  className="w-full bg-slate-900 text-white font-black py-4 px-6 rounded-2xl hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10 disabled:opacity-30 disabled:hover:bg-slate-900"
                >
                  {submitting ? 'PROCESSING...' : 'CONFIRM APPOINTMENT'}
                </button>
                <button 
                  onClick={() => router.back()}
                  className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all"
                >
                  Discard & Exit
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default AppointmentScheduling;
