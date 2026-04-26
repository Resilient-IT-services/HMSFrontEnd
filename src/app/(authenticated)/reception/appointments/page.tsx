'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { AppointmentResponse, DoctorStaffResponse, AppointmentStatus } from '@/types/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

const TodayAppointmentsPage = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [doctorFilter, setDoctorFilter] = useState<string | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [aptRes, doctorRes] = await Promise.all([
        appointmentService.list(0, 100, debouncedSearchTerm),
        doctorService.list(0, 100)
      ]);

      if (aptRes.success && aptRes.data) {
        setAppointments(aptRes.data.content);
      }
      if (doctorRes.success && doctorRes.data) {
        setDoctors(doctorRes.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
    try {
      const res = await appointmentService.updateStatus(id, { status });
      if (res.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
    const matchesDoctor = doctorFilter === 'All' || apt.doctorId === doctorFilter;
    return matchesStatus && matchesDoctor;
  });

  const stats = {
    total: appointments.length,
    checkedIn: appointments.filter(a => a.status === 'CHECKED_IN').length,
    pending: appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length,
    done: appointments.filter(a => a.status === 'COMPLETED').length,
  };

  return (
    <MainLayout title="Daily Schedule" hideTitle>
      <div className="p-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f9f9ff] min-h-screen font-inter">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="font-manrope text-3xl font-black text-slate-900 tracking-tight uppercase">Daily Schedule</h2>
            <p className="text-slate-500 font-medium mt-1">Monitor and manage all clinical appointments for today.</p>
          </div>
          <Link href="/reception/appointments/create">
            <button className="bg-orange-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-600/20">
              <span className="material-symbols-outlined">add_circle</span>
              Schedule Appointment
            </button>
          </Link>
        </div>

        {/* Stats & Search Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
           {/* Metric Cards */}
           <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total', val: stats.total, color: 'text-slate-600', bg: 'bg-slate-100', icon: 'event' },
                { label: 'Checked-in', val: stats.checkedIn, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'login' },
                { label: 'Pending', val: stats.pending, color: 'text-orange-600', bg: 'bg-orange-50', icon: 'hourglass_empty' },
                { label: 'Done', val: stats.done, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'task_alt' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className={`p-2 ${s.bg} ${s.color} rounded-lg mb-2`}>
                    <span className="material-symbols-outlined text-xl">{s.icon}</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-2xl font-black text-slate-900">{s.val}</p>
                </div>
              ))}
           </div>

           {/* Search Box */}
           <div className="lg:col-span-5">
             <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm h-full flex items-center">
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-600/20 transition-all font-bold text-sm outline-none" 
                    placeholder="Search by patient or physician..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
             </div>
           </div>
        </div>

        {/* Filters & Content Area */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
          {/* Filter Bar */}
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Filter By:</span>
               <div className="relative">
                 <select 
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  className="pl-8 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:border-orange-600 transition-colors"
                >
                  <option value="All">All Physicians</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">medical_services</span>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">arrow_drop_down</span>
               </div>
            </div>

            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-inner">
              {['All', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'].map(s => (
                <button 
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                    statusFilter === s 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {s === 'All' ? 'Every Status' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Appt Time</th>
                  <th className="px-6 py-4">Patient Profile</th>
                  <th className="px-6 py-4">Assigned Physician</th>
                  <th className="px-6 py-4 text-center">Visit Status</th>
                  <th className="px-6 py-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-medium">Synchronizing medical records...</td></tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-medium">No appointments found matching your criteria.</td></tr>
                ) : filteredAppointments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 font-black text-orange-700">
                        <span className="material-symbols-outlined text-lg">schedule</span>
                        <span className="text-sm font-manrope">{new Date(row.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 font-bold uppercase border-2 border-white shadow-sm">
                          {row.patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-none mb-1">{row.patientName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: #{String(row.id).substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-sm font-bold text-slate-700">{row.doctorName}</p>
                       <p className="text-[10px] text-orange-600/70 font-black uppercase tracking-widest">{row.doctorSpecialization || 'Clinical Staff'}</p>
                    </td>
                    <td className="px-6 py-5 text-center font-bold">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border-2 ${
                         row.status === 'CHECKED_IN' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                         row.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                         'bg-orange-50 text-orange-700 border-orange-100'
                       }`}>
                         {row.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {row.status !== 'CHECKED_IN' && row.status !== 'COMPLETED' && (
                          <button 
                            onClick={() => handleStatusUpdate(row.id, 'CHECKED_IN')}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-orange-700 shadow-sm"
                          >
                            Mark Check-in
                          </button>
                        )}
                        <button 
                          onClick={() => router.push(`/reception/patients/${row.patientId}`)}
                          className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-orange-700 transition-colors">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TodayAppointmentsPage;
