'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { AppointmentResponse, DoctorStaffResponse, AppointmentStatus } from '@/types/api';
import { useRouter } from 'next/navigation';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken, sortByToken } from '@/utils/tokenHelper';

const TodayAppointmentsPage = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL' | 'UPCOMING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [appRes, docRes] = await Promise.all([
        appointmentService.list(0, 100),
        doctorService.list(0, 100)
      ]);

      if (appRes.success && appRes.data) {
        setAppointments(appRes.data.content);
      }
      if (docRes.success && docRes.data) {
        setDoctors(docRes.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30_000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const base = appointments.filter(app => {
      const appDate = app.appointmentTime.split('T')[0];
      const isToday = appDate === today;
      const isUpcoming = appDate > today;

      // 1. Time-based and Status-based filtering
      if (statusFilter === 'UPCOMING') {
        if (!isUpcoming) return false;
      } else if (statusFilter === 'ALL') {
        if (!isToday) return false;
      } else {
        if (!isToday || app.status !== statusFilter) return false;
      }

      // 2. Search term filtering
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          app.patientName.toLowerCase().includes(term) ||
          (app.patientId && app.patientId.toLowerCase().includes(term))
        );
      }

      return true;
    });

    return sortByToken(base);
  }, [appointments, statusFilter, searchTerm]);

  return (
    <MainLayout title="Daily Schedule">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Appointment Management</h2>
          <button 
            onClick={() => router.push('/reception/appointments/create')}
            className="px-6 py-2.5 bg-orange-700 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-800 transition-all shadow-lg shadow-orange-700/20 active:scale-95"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create Appointment
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'UPCOMING', 'SCHEDULED', 'CHECKED_IN', 'DELAYED', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === status 
                    ? 'bg-orange-700 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {status === 'DELAYED' ? 'Walk-in' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search patient..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => fetchData()}
              className="p-2 text-slate-400 hover:text-orange-700 transition-colors bg-slate-50 rounded-lg border border-slate-200"
              title="Refresh"
            >
              <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">Token</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">Time</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">Patient</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">Doctor</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">Status</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">Loading schedule...</td></tr>
              ) : filteredAppointments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">No appointments found.</td></tr>
              ) : filteredAppointments.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">{formatToken(app)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">{new Date(app.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{app.patientName}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">ID: {app.patientId?.substring(0, 8) || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700">{app.doctorName}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{app.doctorSpecialization}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                      app.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      app.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      app.status === 'CONFIRMED' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      app.status === 'DELAYED' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                      'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {app.status === 'DELAYED' ? 'Walk-in' : app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => {
                          router.push(`/reception/appointments/vitals?appointmentId=${app.id}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-orange-700 text-white text-[10px] font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px]">vital_signs</span>
                        Vitals
                      </button>
                      <button 
                        onClick={() => {
                          router.push(`/reception/billing?appointmentId=${app.id}`);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-orange-700 text-orange-700 text-[10px] font-bold hover:bg-orange-50 transition-all active:scale-95 shadow-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px]">payments</span>
                        Bill
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default TodayAppointmentsPage;
