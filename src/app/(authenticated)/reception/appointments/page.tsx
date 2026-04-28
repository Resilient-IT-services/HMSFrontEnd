'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { AppointmentResponse, DoctorStaffResponse, AppointmentStatus } from '@/types/api';
import { useRouter } from 'next/navigation';

const TodayAppointmentsPage = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');

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

  const filteredAppointments = appointments.filter(app => 
    statusFilter === 'ALL' || app.status === statusFilter
  );

  return (
    <MainLayout title="Daily Schedule">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex gap-2">
            {['ALL', 'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'DELAYED', 'COMPLETED'].map((status) => (
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
          <button 
            onClick={() => fetchData()}
            className="p-2 text-slate-400 hover:text-orange-700 transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">Time</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">Patient</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">Doctor</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase">Status</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">Loading schedule...</td></tr>
              ) : filteredAppointments.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No appointments found.</td></tr>
              ) : filteredAppointments.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
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
                        className="px-4 py-1.5 rounded-lg bg-orange-700 text-white text-xs font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">vital_signs</span>
                        Vitals
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
