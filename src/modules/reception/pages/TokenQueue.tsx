'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentSummaryDTO } from '@/types/api';
import { Stethoscope, Pill, Microscope, Info, Droplets } from 'lucide-react';
import { formatToken } from '@/utils/tokenHelper';

export function TokenQueue() {
  const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await appointmentService.listSummary(0, 100, undefined, today);
      if (res.success && res.data) {
        setAppointments(res.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch queue', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10_000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const getDepartmentQueue = (dept: string) => {
    // For now, filtering by specialization if available or just mocking grouping
    return appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'WALK_IN');
  };

  const opdQueue = getDepartmentQueue('OPD');

  return (
    <MainLayout title="Live Token Status">
      <div className="space-y-10">
        {/* Header Indicator */}
        <div className="flex justify-end">
          <div className="bg-[var(--primary-light)] text-[var(--primary)] px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary)]"></span>
            </span>
            SYSTEM LIVE
          </div>
        </div>

        {/* Primary Queue Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* OPD Department */}
          <div className="flex flex-col bg-[var(--surface)] rounded-xl shadow-xl overflow-hidden border border-[var(--border)]">
            <div className="bg-[var(--primary)] p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <Stethoscope className="size-6" />
                <h3 className="text-xl font-bold uppercase tracking-wider">Outpatient (OPD)</h3>
              </div>
              <span className="bg-white/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">Counter 01-04</span>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center border-b border-[var(--border)]">
              <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest mb-2 opacity-50">Now Serving</p>
              <div className="text-8xl font-black text-[var(--primary)] tracking-tighter">
                {opdQueue[0] ? formatToken(opdQueue[0]) : '---'}
              </div>
            </div>

            <div className="p-6 bg-[var(--background)]/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[var(--text-secondary)] font-bold uppercase text-xs">Waiting List</span>
                <span className="text-[var(--primary)] font-bold text-xs uppercase">{opdQueue.length} in queue</span>
              </div>
              <div className="flex gap-4 justify-between">
                <div className="flex flex-col flex-1 items-center bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] shadow-sm">
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase opacity-50">Next</span>
                  <span className="text-2xl font-black text-[var(--text-primary)]">
                    {opdQueue[1] ? formatToken(opdQueue[1]) : '--'}
                  </span>
                </div>
                <div className="flex flex-col flex-1 items-center bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] shadow-sm">
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase opacity-50">Followed By</span>
                  <span className="text-2xl font-black text-[var(--text-secondary)] opacity-50">
                    {opdQueue[2] ? formatToken(opdQueue[2]) : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pharmacy Placeholder */}
          <div className="flex flex-col bg-[var(--surface)] rounded-xl shadow-xl overflow-hidden border border-[var(--border)] opacity-70">
            <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <Pill className="size-6" />
                <h3 className="text-xl font-bold uppercase tracking-wider">Pharmacy</h3>
              </div>
            </div>
            <div className="p-8 flex flex-col items-center justify-center border-b border-[var(--border)]">
              <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest mb-2 opacity-50">Now Serving</p>
              <div className="text-8xl font-black text-emerald-600 tracking-tighter">P-089</div>
            </div>
            <div className="p-6 bg-[var(--background)]/50 text-center text-xs font-bold text-[var(--text-secondary)] uppercase">
              No active prescriptions in queue
            </div>
          </div>

          {/* Lab Placeholder */}
          <div className="flex flex-col bg-[var(--surface)] rounded-xl shadow-xl overflow-hidden border border-[var(--border)] opacity-70">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <Microscope className="size-6" />
                <h3 className="text-xl font-bold uppercase tracking-wider">Laboratory</h3>
              </div>
            </div>
            <div className="p-8 flex flex-col items-center justify-center border-b border-[var(--border)]">
              <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest mb-2 opacity-50">Now Serving</p>
              <div className="text-8xl font-black text-indigo-600 tracking-tighter">L-112</div>
            </div>
             <div className="p-6 bg-[var(--background)]/50 text-center text-xs font-bold text-[var(--text-secondary)] uppercase">
              Lab services offline
            </div>
          </div>
        </div>

        {/* Bottom Information Panel */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[var(--primary-light)] rounded-xl p-8 flex gap-6 items-start border border-[var(--primary)]/10">
            <div className="p-4 bg-[var(--primary)] text-white rounded-xl">
              <Info className="size-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2 uppercase tracking-tight">Wait Time Estimates</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase opacity-50">OPD</p>
                  <p className="text-lg font-black text-[var(--primary)]">~25 min</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase opacity-50">Pharmacy</p>
                  <p className="text-lg font-black text-emerald-600">~10 min</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase opacity-50">Lab</p>
                  <p className="text-lg font-black text-indigo-600">~15 min</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-6 overflow-hidden relative group flex items-center justify-between">
            <div className="text-white relative z-10">
              <h4 className="text-xl font-bold mb-1 uppercase tracking-tight">Health Tip of the Day</h4>
              <p className="text-slate-400 max-w-xs text-sm font-medium">Stay hydrated. Drinking enough water daily is crucial for your body's overall function.</p>
            </div>
            <div className="text-slate-700 opacity-20 transform translate-x-4">
              <Droplets className="size-24" />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
