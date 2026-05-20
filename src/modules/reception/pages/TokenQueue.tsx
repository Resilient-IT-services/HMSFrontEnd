'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentSummaryDTO } from '@/types/api';
import { Stethoscope, Pill, Microscope, Info, Droplets } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { formatToken } from '@/utils/tokenHelper';
import { DASHBOARD_REFRESH_INTERVAL } from '@/utils/constants';
import { getHospitalDayRangeUTC } from '@/utils/dateValidator';
import dayjs from '@/lib/dayjs';

export function TokenQueue() {
  const { hospitalTimezone } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      if (!hospitalTimezone) return;
      const { from, to } = getHospitalDayRangeUTC(hospitalTimezone);
      const res = await appointmentService.listSummary(0, 100, undefined, from, to);
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
    const trigger = async () => {
      await fetchQueue();
    };
    void trigger();
    const interval = setInterval(() => {
      void trigger();
    }, DASHBOARD_REFRESH_INTERVAL); // Poll at dashboard refresh interval
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const getDepartmentQueue = (dept: string) => {
    // For now, filtering by specialization if available or just mocking grouping
    return appointments.filter(a => a.status === 'SCHEDULED');
  };

  const opdQueue = getDepartmentQueue('OPD');

  return (
    <MainLayout title="Live Token Status">
      <div className="space-y-6 sm:space-y-10 px-2 sm:px-0">
        {/* Header Indicator */}
        <div className="flex justify-end">
          <div className="bg-orange-600/10 text-orange-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-black text-[10px] sm:text-sm flex items-center gap-2 border border-orange-600/20">
            <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-orange-600"></span>
            </span>
            SYSTEM LIVE
          </div>
        </div>

        {/* Primary Queue Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* OPD Department */}
          <div className="flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-orange-600 p-4 sm:p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-2 sm:gap-3">
                <Stethoscope className="size-5 sm:size-6" />
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider">Outpatient (OPD)</h3>
              </div>
              <span className="bg-white/20 px-2 py-1 rounded text-[8px] sm:text-xs font-black uppercase tracking-widest">Counter 01-04</span>
            </div>
            
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center border-b border-slate-100 bg-orange-50/30">
              <p className="text-slate-400 text-[10px] sm:text-sm font-black uppercase tracking-widest mb-2 opacity-50">Now Serving</p>
              <div className="text-6xl sm:text-8xl font-black text-orange-600 tracking-tighter">
                {opdQueue[0] ? formatToken(opdQueue[0]) : '---'}
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 font-black uppercase text-[10px]">Waiting List</span>
                <span className="text-orange-600 font-black text-[10px] uppercase">{opdQueue.length} in queue</span>
              </div>
              <div className="flex gap-3 sm:gap-4 justify-between">
                <div className="flex flex-col flex-1 items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100">
                  <span className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase opacity-50">Next</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    {opdQueue[1] ? formatToken(opdQueue[1]) : '--'}
                  </span>
                </div>
                <div className="flex flex-col flex-1 items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100">
                  <span className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase opacity-50">Following</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-300">
                    {opdQueue[2] ? formatToken(opdQueue[2]) : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pharmacy Placeholder */}
          <div className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 opacity-70">
            <div className="bg-emerald-600 p-4 sm:p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-2 sm:gap-3">
                <Pill className="size-5 sm:size-6" />
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider">Pharmacy</h3>
              </div>
            </div>
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center border-b border-slate-100">
              <p className="text-slate-400 text-[10px] sm:text-sm font-black uppercase tracking-widest mb-2 opacity-50">Now Serving</p>
              <div className="text-6xl sm:text-8xl font-black text-emerald-600 tracking-tighter">P-089</div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              No active prescriptions
            </div>
          </div>

          {/* Lab Placeholder */}
          <div className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 opacity-70">
            <div className="bg-indigo-600 p-4 sm:p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-2 sm:gap-3">
                <Microscope className="size-5 sm:size-6" />
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider">Laboratory</h3>
              </div>
            </div>
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center border-b border-slate-100">
              <p className="text-slate-400 text-[10px] sm:text-sm font-black uppercase tracking-widest mb-2 opacity-50">Now Serving</p>
              <div className="text-6xl sm:text-8xl font-black text-indigo-600 tracking-tighter">L-112</div>
            </div>
             <div className="p-4 sm:p-6 bg-slate-50 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Lab services offline
            </div>
          </div>
        </div>

        {/* Bottom Information Panel */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-orange-50 rounded-2xl p-6 sm:p-8 flex flex-col xs:flex-row gap-4 sm:gap-6 items-start border border-orange-100">
            <div className="p-3 sm:p-4 bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-600/20">
              <Info className="size-6 sm:size-8" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg sm:text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Wait Time Estimates</h4>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">OPD</p>
                  <p className="text-sm sm:text-lg font-black text-orange-600 whitespace-nowrap">~25 min</p>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">Pharm</p>
                  <p className="text-sm sm:text-lg font-black text-emerald-600 whitespace-nowrap">~10 min</p>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">Lab</p>
                  <p className="text-sm sm:text-lg font-black text-indigo-600 whitespace-nowrap">~15 min</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden relative group flex items-center justify-between min-h-[140px]">
            <div className="text-white relative z-10 pr-12">
              <h4 className="text-lg sm:text-xl font-black mb-1 uppercase tracking-tight italic">Health Tip</h4>
              <p className="text-slate-400 text-xs sm:text-sm font-bold leading-relaxed">Stay hydrated. Drinking enough water daily is crucial for your body's overall function.</p>
            </div>
            <div className="absolute right-0 bottom-0 text-slate-800 opacity-20 transform translate-x-4 translate-y-4">
              <Droplets className="size-24 sm:size-32" />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
