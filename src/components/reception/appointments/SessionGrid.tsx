'use client';

import React from 'react';
import { SessionInfo, DoctorStaffResponse } from '@/types/api';

interface SessionGridProps {
  fetchingAvailability: boolean;
  selectedDoctor: DoctorStaffResponse | null;
  availability: SessionInfo[];
  selectedSession: SessionInfo | null;
  setSelectedSession: (session: SessionInfo) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateOptions: { iso: string, label: string, active: boolean }[];
  formatLocalTime: (t: string) => string;
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
  const getSessionIcon = (startTime: string) => {
    if (startTime < '12:00') return 'wb_twilight';
    if (startTime < '17:00') return 'light_mode';
    return 'dark_mode';
  };

  const getSessionName = (startTime: string) => {
    if (startTime < '12:00') return 'Morning';
    if (startTime < '17:00') return 'Afternoon';
    return 'Evening';
  };

  return (
    <section className="flex-1 px-8 py-6 overflow-y-auto custom-scrollbar bg-background">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Date Selection */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 font-headline-sm">Choose Appointment Date</h2>
          <div className="flex flex-wrap gap-2">
            {dateOptions.map((opt) => (
              <button
                key={opt.iso}
                onClick={() => setSelectedDate(opt.iso)}
                className={`px-4 py-2 rounded-full font-bold text-sm shadow-sm border transition-all ${
                  opt.active
                    ? 'bg-primary-container text-white border-primary-container'
                    : 'bg-slate-100 text-slate-600 border-transparent hover:border-primary-container/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Session Selection */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 font-headline-sm">Select Preferred Session</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {fetchingAvailability ? (
              <div className="py-2 text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Querying sessions...</div>
            ) : selectedDoctor ? availability.length === 0 ? (
              <div className="py-2 text-xs text-slate-400 font-bold uppercase tracking-widest">No active sessions for this date</div>
            ) : (
              availability.map((session, idx) => {
                const isSelected = selectedSession === session;
                const isDisabled = !session.available;
                return (
                  <button
                    key={idx}
                    disabled={isDisabled}
                    onClick={() => setSelectedSession(session)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-sm border transition-all ${
                      isSelected
                        ? 'bg-primary-container text-white border-primary-container'
                        : (isDisabled
                        ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed opacity-60'
                        : 'bg-slate-100 text-slate-600 border-transparent hover:border-primary-container/50')
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{getSessionIcon(session.startTime)}</span>
                    <span>{getSessionName(session.startTime)} {formatLocalTime(session.startTime)} - {formatLocalTime(session.endTime)}</span>
                  </button>
                );
              })
            ) : (
              <div className="py-2 text-xs text-slate-400 font-bold uppercase tracking-widest">Select a doctor first</div>
            )}
          </div>

          {/* Time Slots (Mockup of current selection) */}
          {selectedSession && (
            <div className="flex flex-wrap gap-2 pt-1 animate-in slide-in-from-top-1">
               <button className="px-3 py-1.5 bg-primary-container text-white text-xs font-bold rounded-lg border border-primary-container shadow-sm">
                 {formatLocalTime(selectedSession.nextSuggestedTime || selectedSession.startTime)} (Suggested)
               </button>
            </div>
          )}

          {/* Subtle Notice */}
          <p className="mt-4 flex items-center gap-1.5 text-slate-500 text-[12px]">
            <span className="material-symbols-outlined text-sm text-slate-400">warning</span>
            Please ensure the patient arrives 15 minutes before the scheduled time.
          </p>
        </div>

        {/* Slot Status Indicators */}
        <div className="pt-2 flex gap-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span> Selected
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white border border-slate-300"></span> Available
          </div>
          <div className="flex items-center gap-1.5 opacity-50">
            <span className="w-2 h-2 rounded-full bg-slate-100 border border-slate-200"></span> Booked
          </div>
        </div>
      </div>
    </section>
  );
};
