'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { AppointmentResponse, DoctorStaffResponse, AppointmentStatus } from '@/types/api';
import { useRouter } from 'next/navigation';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken, sortByToken } from '@/utils/tokenHelper';
import { Modal } from '@/components/ui/Modal';

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'WALK_IN':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'SCHEDULED':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'PAYMENT_PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'ADD_VITALS':
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    case 'WAITING_FOR_VITALS':
      return 'bg-purple-50 text-purple-700 border-purple-100';
    case 'COMPLETED':
      return 'bg-green-50 text-green-700 border-green-100';
    case 'CANCELLED':
      return 'bg-red-50 text-red-700 border-red-100';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-100';
  }
};

export default function TodayAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL' | 'UPCOMING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced Filter State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    statuses: [] as string[],
    paymentStatuses: [] as string[]
  });

  const [activeFilters, setActiveFilters] = useState<any>({});
  const [stats, setStats] = useState({
    total: 0,
    walkIn: 0,
    upcoming: 0,
    paymentPending: 0,
    waitingForVitals: 0,
    completed: 0,
    cancelled: 0,
  });

  const fetchData = useCallback(async (isBackground = false, filters = activeFilters) => {
    if (!isBackground) setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let dateToUse = (statusFilter === 'UPCOMING' ? undefined : today);
      
      let statusesToUse = filters.statuses?.length > 0 
        ? filters.statuses.join(',') 
        : (statusFilter === 'ALL' || statusFilter === 'UPCOMING' ? undefined : statusFilter);

      const [appRes, docRes, statsRes] = await Promise.all([
        appointmentService.list(
          0, 100, 
          searchTerm, 
          dateToUse,
          undefined,
          statusesToUse,
          filters.paymentStatuses?.join(','),
          undefined,
          undefined,
          undefined
        ),
        doctorService.list(0, 100),
        appointmentService.list(0, 500)
      ]);

      const appData = appRes.data;
      if (appRes.success && appData) {
        setAppointments(appData.content);
      }
      const docData = docRes.data;
      if (docRes.success && docData) {
        setDoctors(docData.content);
      }

      if (statsRes.success && statsRes.data) {
        const allApps = statsRes.data.content;
        const todayApps = allApps.filter(app => app.appointmentTime.split('T')[0] === today);
        setStats({
          total: todayApps.length,
          walkIn: todayApps.filter(app => app.status === 'WALK_IN').length,
          upcoming: allApps.filter(app => app.appointmentTime.split('T')[0] > today).length,
          paymentPending: todayApps.filter(app => app.status === 'PAYMENT_PENDING').length,
          waitingForVitals: todayApps.filter(app => app.status === 'WAITING_FOR_VITALS').length,
          completed: todayApps.filter(app => app.status === 'COMPLETED').length,
          cancelled: todayApps.filter(app => app.status === 'CANCELLED').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [statusFilter, searchTerm, activeFilters]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const applyFilters = () => {
    setActiveFilters(advancedFilters);
    setIsFilterModalOpen(false);
  };

  const resetFilters = () => {
    const reset = {
      statuses: [],
      paymentStatuses: []
    };
    setAdvancedFilters(reset);
    setActiveFilters(reset);
    setIsFilterModalOpen(false);
  };

  const removeFilter = (key: string, value?: string) => {
    const updated = { ...activeFilters };
    if (Array.isArray(updated[key])) {
      updated[key] = updated[key].filter((v: string) => v !== value);
    } else {
      updated[key] = '';
    }
    setActiveFilters(updated);
    setAdvancedFilters(updated);
  };

  const filteredAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const base = appointments.filter(app => {
      const appDate = app.appointmentTime.split('T')[0];
      const isToday = appDate === today;
      const isUpcoming = appDate > today;

      if (statusFilter === 'UPCOMING') {
        if (!isUpcoming) return false;
      } else if (statusFilter === 'ALL') {
        if (!isToday) return false;
      } else {
        if (!activeFilters.statuses?.length && app.status !== statusFilter) return false;
      }

      return true;
    });

    return sortByToken(base);
  }, [appointments, statusFilter, activeFilters]);

  return (
    <MainLayout title="Appointments Dashboard" hideTitle>
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-gray-50/50 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 font-manrope">Today's Appointments</h1>
            <p className="text-slate-500 text-sm lg:text-base">Real-time status of all patient visits for today.</p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filters {(activeFilters.statuses?.length || 0) + (activeFilters.paymentStatuses?.length || 0) > 0 && 
                `(${(activeFilters.statuses?.length || 0) + (activeFilters.paymentStatuses?.length || 0)})`}
            </button>
            <button 
              onClick={() => router.push('/reception/patient-registration')}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-orange-700 shadow-md shadow-orange-600/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              New Visit
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: 'Today Total', value: stats.total, color: 'text-slate-600', bg: 'bg-slate-50', filter: 'ALL' },
            { label: 'Walk-In', value: stats.walkIn, color: 'text-emerald-600', bg: 'bg-emerald-50', filter: 'WALK_IN' },
            { label: 'Upcoming', value: stats.upcoming, color: 'text-blue-600', bg: 'bg-blue-50', filter: 'UPCOMING' },
            { label: 'Pay Pending', value: stats.paymentPending, color: 'text-amber-600', bg: 'bg-amber-50', filter: 'PAYMENT_PENDING' },
            { label: 'Waiting Vitals', value: stats.waitingForVitals, color: 'text-purple-600', bg: 'bg-purple-50', filter: 'WAITING_FOR_VITALS' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50', filter: 'COMPLETED' },
            { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600', bg: 'bg-red-50', filter: 'CANCELLED' },
          ].map((stat, i) => (
            <div 
              key={i} 
              onClick={() => {
                setStatusFilter(stat.filter as any);
                if (activeFilters.statuses?.length) {
                  const updated = { ...activeFilters, statuses: [] };
                  setActiveFilters(updated);
                  setAdvancedFilters(updated);
                }
              }}
              className={`${stat.bg} p-3 rounded-xl border ${statusFilter === stat.filter ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-100'} shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95`}
            >
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 truncate">{stat.label}</p>
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['ALL', 'UPCOMING', 'SCHEDULED', 'WALK_IN', 'PAYMENT_PENDING', 'ADD_VITALS', 'WAITING_FOR_VITALS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status as any);
                  if (activeFilters.statuses?.length) {
                    const updated = { ...activeFilters, statuses: [] };
                    setActiveFilters(updated);
                    setAdvancedFilters(updated);
                  }
                }}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  statusFilter === status 
                    ? 'bg-orange-700 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL' ? 'Today' : status.replace('_', ' ')}
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
              onClick={() => setIsFilterModalOpen(true)}
              className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                Object.values(activeFilters).some(v => Array.isArray(v) ? v.length > 0 : !!v)
                  ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-orange-700'
              }`}
              title="Advanced Filter"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span className="text-[10px] font-bold hidden md:block">Filters</span>
            </button>
            <button 
              onClick={() => fetchData()}
              className="p-2 text-slate-400 hover:text-orange-700 transition-colors bg-slate-50 rounded-lg border border-slate-200"
              title="Refresh"
            >
              <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>
        </div>

        {Object.values(activeFilters).some(v => Array.isArray(v) ? v.length > 0 : !!v) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Filters:</span>
            {activeFilters.statuses?.map((s: string) => (
              <span key={s} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold flex items-center gap-1 border border-purple-200">
                Status: {s.replace('_', ' ')}
                <button onClick={() => removeFilter('statuses', s)} className="hover:text-purple-900"><span className="material-symbols-outlined text-[14px]">close</span></button>
              </span>
            ))}
            {activeFilters.paymentStatuses?.map((ps: string) => (
              <span key={ps} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold flex items-center gap-1 border border-amber-200">
                Payment: {ps}
                <button onClick={() => removeFilter('paymentStatuses', ps)} className="hover:text-amber-900"><span className="material-symbols-outlined text-[14px]">close</span></button>
              </span>
            ))}
            <button 
              onClick={resetFilters}
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 underline transition-colors ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
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
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-slate-200">search_off</span>
                      <p className="text-slate-400 italic font-medium">No appointments found for selected filters.</p>
                      <button onClick={resetFilters} className="text-orange-700 text-xs font-bold hover:underline">Clear all filters</button>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.map((app) => (
                <tr 
                  key={app.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onDoubleClick={() => router.push(`/reception/appointments/vitals?appointmentId=${app.id}`)}
                >
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
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyles(app.status)}`}>
                      {app.status.replace('_', ' ')}
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
      </div>

      <Modal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        title="Advanced Filters"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Appointment Status</label>
            <div className="flex flex-wrap gap-2">
              {['SCHEDULED', 'WALK_IN', 'PAYMENT_PENDING', 'ADD_VITALS', 'WAITING_FOR_VITALS', 'COMPLETED', 'CANCELLED'].map(s => (
                <label key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                  advancedFilters.statuses.includes(s) 
                    ? 'bg-orange-700 text-white border-orange-700' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                }`}>
                  <input 
                    type="checkbox" 
                    hidden
                    checked={advancedFilters.statuses.includes(s)}
                    onChange={(e) => {
                      const items = e.target.checked 
                        ? [...advancedFilters.statuses, s]
                        : advancedFilters.statuses.filter(i => i !== s);
                      setAdvancedFilters({...advancedFilters, statuses: items});
                    }}
                  />
                  <span className="text-[10px] font-bold">{s.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Payment Status</label>
            <div className="flex flex-wrap gap-2">
              {['PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'].map(ps => (
                <label key={ps} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                  advancedFilters.paymentStatuses.includes(ps) 
                    ? 'bg-blue-700 text-white border-blue-700' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}>
                  <input 
                    type="checkbox" 
                    hidden
                    checked={advancedFilters.paymentStatuses.includes(ps)}
                    onChange={(e) => {
                      const items = e.target.checked 
                        ? [...advancedFilters.paymentStatuses, ps]
                        : advancedFilters.paymentStatuses.filter(i => i !== ps);
                      setAdvancedFilters({...advancedFilters, paymentStatuses: items});
                    }}
                  />
                  <span className="text-[10px] font-bold">{ps.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Reset All
            </button>
            <button 
              onClick={applyFilters}
              className="px-6 py-2 bg-orange-700 text-white rounded-lg text-xs font-bold hover:bg-orange-800 transition-all shadow-md active:scale-95"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
