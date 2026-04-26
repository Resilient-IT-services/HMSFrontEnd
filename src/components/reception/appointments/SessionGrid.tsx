'use client';

import React from 'react';
import { SessionInfo, DoctorStaffResponse, LocalTime } from '@/types/api';

interface SessionGridProps {
  fetchingAvailability: boolean;
  selectedDoctor: DoctorStaffResponse | null;
  availability: SessionInfo[];
  selectedSession: SessionInfo | null;
  setSelectedSession: (session: SessionInfo) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateOptions: { iso: string, label: string, active: boolean }[];
  formatLocalTime: (lt: LocalTime) => string;
}

export const SessionGrid: React.FC<SessionGridProps> = ({
  fetchingAvailability,
  selectedDoctor,
  availability,
  selectedSession,
  setSelectedSession,
  selectedDate,
  setSelectedDate,
  dateOptions,
  formatLocalTime
}) => {
  return (
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
                     
                     <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${session.available ? 'bg-orange-500' : 'bg-slate-300'}`}
                          style={{ width: `${(session.currentBookings / session.maxPatients) * 100}%` }}
                        ></div>
                     </div>
                  </div>
                  
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
  );
};
