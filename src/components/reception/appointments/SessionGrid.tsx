'use client';

import React from 'react';
import { SessionInfo, DoctorStaffResponse } from '@/types/api';

interface SessionGridProps {
  fetchingAvailability: boolean;
  selectedDoctor: DoctorStaffResponse | null;
  availability: SessionInfo[];
  selectedSession: SessionInfo | null;
  setSelectedSession: (session: SessionInfo) => void;
  onSessionSelect: (session: SessionInfo) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateOptions: { iso: string, label: string, active: boolean }[];
  formatLocalTime: (t: string) => string;
  editableTime: string;
  setEditableTime: (t: string) => void;
}

export const SessionGrid: React.FC<SessionGridProps> = ({
  fetchingAvailability,
  selectedDoctor,
  availability,
  selectedSession,
  setSelectedSession,
  onSessionSelect,
  selectedDate,
  setSelectedDate,
  dateOptions,
  formatLocalTime,
  editableTime,
  setEditableTime
}) => {
  const getSessionName = (time: string) => {
    if (!time) return '--';
    if (time < '12:00') return 'Morning';
    if (time < '17:00') return 'Afternoon';
    return 'Evening';
  };

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const matchingSession = availability.find(s => editableTime >= s.startTime && editableTime < s.endTime);

  // Sync selected session when editableTime changes
  React.useEffect(() => {
    if (matchingSession) {
      if (matchingSession !== selectedSession) {
        setSelectedSession(matchingSession);
      }
    } else if (selectedSession && editableTime) {
      // Clear selection if manually entered time is out of any session range
      setSelectedSession(null as any);
    }
  }, [editableTime, matchingSession, selectedSession, setSelectedSession]);

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <label className="block font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
          Select Date
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {dateOptions.map((opt: any) => {
            const dateObj = new Date(opt.iso);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            
            return (
              <button
                key={opt.iso}
                onClick={() => setSelectedDate(opt.iso)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-2 border-2 rounded-lg transition-all ${
                  opt.active
                    ? 'border-primary bg-orange-50'
                    : 'border-slate-100 bg-white hover:border-primary/50'
                }`}
              >
                <span className={`text-[9px] font-black uppercase ${opt.active ? 'text-primary' : 'text-slate-400'}`}>{month}</span>
                <span className={`text-base font-black ${opt.active ? 'text-primary' : 'text-slate-900'}`}>{day}</span>
                <span className={`text-[9px] font-bold ${opt.active ? 'text-primary/70' : 'text-slate-500'}`}>{opt.label === 'Today' ? 'Today' : weekday}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Selection */}
      <div>
        <label className="block font-bold text-slate-700 mb-3 flex justify-between items-center text-sm">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">schedule</span>
            Available Slots {selectedDate === getLocalDateString(new Date()) ? '(Today)' : ''}
          </span>
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {fetchingAvailability ? (
            <div className="col-span-full py-4 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse border border-dashed border-slate-200 rounded-lg">
              Querying sessions...
            </div>
          ) : selectedDoctor ? availability.length === 0 ? (
            <div className="col-span-full py-4 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-200 rounded-lg">
              No active sessions
            </div>
          ) : (
            availability.map((session, idx) => {
              const isSelected = selectedSession === session;
              const isDisabled = !session.available;
              return (
                <button
                  key={idx}
                  disabled={isDisabled}
                  onClick={() => onSessionSelect(session)}
                  className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all group ${
                    isSelected
                      ? 'border-primary bg-orange-50 ring-1 ring-primary/20'
                      : (isDisabled
                      ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50'
                      : 'border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50')
                  }`}
                >
                  <span className={`text-xs font-black ${isSelected ? 'text-primary' : 'text-slate-900 group-hover:text-primary transition-colors'}`}>
                    {formatLocalTime(session.startTime)} - {formatLocalTime(session.endTime)}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-tighter ${isSelected ? 'text-primary/70' : 'text-slate-400'}`}>
                    {isSelected ? 'Selected' : (isDisabled ? 'Full' : 'Available')}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="col-span-full py-4 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-200 rounded-lg">
              Select doctor first
            </div>
          )}
        </div>

        {/* Editable Time Slot */}
        <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-xl animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Exact Appointment Time</p>
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  value={editableTime}
                  onChange={(e) => setEditableTime(e.target.value)}
                  className="bg-white border border-primary/20 rounded-lg px-2 py-1 text-xl font-black text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                />
              </div>
              {!matchingSession && editableTime && (
                <p className="text-[10px] font-bold text-red-600 mt-1">No available slot found for the selected appointment time.</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Period</p>
              <p className="font-bold text-slate-700 text-sm">{getSessionName(editableTime)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
