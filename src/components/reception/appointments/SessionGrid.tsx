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
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <section className="flex-1 bg-white rounded-custom border border-slate-200 flex flex-col shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button 
            className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-200"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <h3 className="font-bold text-base">{formattedDate}</h3>
          <button 
            className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-200"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg scale-90">
          <button className="px-4 py-1 bg-white shadow-sm rounded-md text-[11px] font-bold text-primary uppercase">Week</button>
          <button className="px-4 py-1 text-[11px] font-bold text-slate-500 uppercase">Day</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
        {fetchingAvailability ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
          </div>
        ) : availability.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">event_busy</span>
            <p className="text-sm font-bold text-slate-400">No slots available for this date.</p>
          </div>
        ) : (
          availability.map((session, idx) => {
            const isSelected = selectedSession === session;
            const isDisabled = !session.available;
            
            return (
              <div 
                key={idx}
                onClick={() => session.available && setSelectedSession(session)}
                className={`session-card ${
                  isSelected ? 'session-card-selected' : isDisabled ? 'session-card-disabled' : 'session-card-default'
                } rounded-custom p-4 flex items-center justify-between transition-all`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {session.startTime < '12:00' ? '🌅' : session.startTime < '17:00' ? '🌤' : '🌙'}
                  </div>
                  <div>
                    <p className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {session.startTime < '12:00' ? 'Morning Session' : session.startTime < '17:00' ? 'Afternoon Session' : 'Evening Session'}
                    </p>
                    <p className={`text-xs ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                      {formatLocalTime(session.startTime)} – {formatLocalTime(session.endTime)}
                    </p>
                  </div>
                </div>
                {isSelected && <span className="material-symbols-outlined text-xl text-white">check_circle</span>}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
