'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { RootState } from '@/state/store';
import { AppointmentResponse, DoctorRevenueSummaryDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken, sortByToken } from '@/utils/tokenHelper';
import { normalizeAppointmentData, syncExpiredAppointments } from '@/utils/appointmentHelper';
import { useDebounce } from '@/hooks/useDebounce';
import { DEFAULT_DEBOUNCE_MS } from '@/utils/constants';
import { Table, Column } from '@/components/ui/Table';
import { PageSurface } from '@/components/ui/PageSurface';
import { useConsultationFee } from '@/hooks/useConsultationFee';
import { DASHBOARD_REFRESH_INTERVAL, DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { getHospitalDayRangeUTC } from '@/utils/dateValidator';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import Link from 'next/link';
import dayjs from '@/lib/dayjs';

// Pharmacy Style Lucid Icons Integration
import {
  FileText, Hourglass, CheckCircle2, AlertTriangle,
  IndianRupee, Plus, Search, ClipboardList, ArrowRight, Eye,
  Clock, History
} from 'lucide-react';

const DASHBOARD_QUEUE_STATUSES = new Set(['PAID', 'VITALS_RECORDED', 'CONSULTATION_STARTED']);

export const DoctorDashboard = () => {
  const router = useRouter();
  const { user, hospitalTimezone } = useSelector((state: RootState) => state.auth);
  const consultationFee = useConsultationFee();

  // Primary States
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<DoctorRevenueSummaryDTO | null>(null);
  const [recentHistories, setRecentHistories] = useState<AppointmentResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const debouncedColumnFilters = useDebounce(columnFilters, DEFAULT_DEBOUNCE_MS);

  // API Call Data Aggregator
  const fetchData = useCallback(async (isBackground = false) => {
    if (!user || !hospitalTimezone) {
      setLoading(false);
      return;
    }

    try {
      if (!isBackground) setLoading(true);
      const { from, to } = getHospitalDayRangeUTC(hospitalTimezone);

      const [appRes, revRes, histRes] = await Promise.all([
        appointmentService.list({
          page: 0,
          size: DEFAULT_PAGE_SIZE,
          from,
          to,
          doctorId: user.id,
          ...debouncedColumnFilters
        }),
        doctorService.getRevenueSummary(user.id, from, to),
        // Bina from/to parameters ke global broad range pull taaki history purani bhi aa sake
        appointmentService.list({
          page: 0,
          size: 10,
          status: 'COMPLETED',
          doctorId: user.id,
          sort: 'appointmentTime,desc'
        })
      ]);

      if (appRes.success && appRes.data) {
        const filtered = appRes.data.content.filter(app =>
            app.doctorId === user.id ||
            app.doctorName.toLowerCase().includes(user.fullName.toLowerCase())
        );

        const normalized = normalizeAppointmentData(filtered);
        setAppointments(normalized);
        setTotalElements(appRes.data.totalElements);
        syncExpiredAppointments(filtered);
      }

      if (revRes.success && revRes.data) {
        setRevenueSummary(revRes.data);
      }

      if (histRes.success && histRes.data) {
        setRecentHistories(histRes.data.content || []);
      }
    } catch (error) {
      console.error('Doctor Dashboard Fetch Error:', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [user, hospitalTimezone, debouncedColumnFilters]);

  useEffect(() => {
    const trigger = async () => {
      await fetchData();
    };
    void trigger();
  }, [fetchData]);

  useAutoRefresh(fetchData, DASHBOARD_REFRESH_INTERVAL, !!user);

  const dynamicHistoriesWidgetData = useMemo(() => {
    return recentHistories.slice(0, 5);
  }, [recentHistories]);

  // Metrics Processors
  const stats = useMemo(() => {
    const waiting = appointments.filter((a) => a.status === 'PAID' || a.status === 'VITALS_RECORDED').length;
    const active = appointments.filter((a) => a.status === 'CONSULTATION_STARTED').length;
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;
    const earnedAppointments = appointments.filter(a => a.status !== 'CANCELLED' && a.status !== 'PAYMENT_PENDING');

    const earnings = (revenueSummary?.totalRevenue && revenueSummary.totalRevenue > 0)
        ? revenueSummary.totalRevenue
        : (typeof consultationFee === 'number' ? earnedAppointments.length * consultationFee : 0);

    return {
      total: revenueSummary?.totalAppointments ?? totalElements,
      waiting,
      active,
      completed,
      cancelled,
      earnings
    };
  }, [appointments, revenueSummary, totalElements, consultationFee]);

  const queue = useMemo(() => {
    if (!hospitalTimezone) return [];
    const hospitalToday = dayjs().tz(hospitalTimezone).format('YYYY-MM-DD');
    const base = appointments.filter(
        (appointment) =>
            dayjs(appointment.appointmentTime).tz(hospitalTimezone).format('YYYY-MM-DD') === hospitalToday &&
            DASHBOARD_QUEUE_STATUSES.has(appointment.status)
    );
    return sortByToken(base);
  }, [appointments, hospitalTimezone]);

  // Search Engine Filters
  const filteredQueue = useMemo(() => {
    let result = queue;
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((p) =>
          p.patientName?.toLowerCase().includes(term) ||
          p.id?.toString().toLowerCase().includes(term) ||
          p.patientCode?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [queue, searchTerm]);

  // Action Controllers
  const handleStartConsultation = async (appointmentId: string) => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      if (appointment.status === 'CONSULTATION_STARTED') {
        router.push(`/doctor/active-consultation?appointmentId=${appointmentId}`);
        return;
      }
      router.push(`/doctor/active-consultation?appointmentId=${appointmentId}`);
    } catch (error) {
      console.error('Failed to start consultation:', error);
      triggerGlobalToast('Failed to initialize engine', 'error');
    }
  };

  const handleStartNextConsultation = async () => {
    if (!user?.id) return;
    try {
      const res = await appointmentService.startNextConsultation(user.id);
      if (res.success && res.data?.id) {
        router.push(`/doctor/active-consultation?appointmentId=${res.data.id}`);
      } else {
        triggerGlobalToast('No patients in the queue', 'info');
      }
    } catch (error) {
      console.error('Failed to start next consultation:', error);
      triggerGlobalToast('Failed to start next consultation', 'error');
    }
  };

  // Structured Columns layout
  const columns: Column<AppointmentResponse>[] = [
    {
      header: 'Token',
      render: (p) => (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
              p.status === 'CONSULTATION_STARTED' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
          }`}>
          {formatToken(p)}
        </span>
      )
    },
    {
      header: 'Patient',
      render: (p) => (
          <div>
            <p className="font-semibold text-slate-800">{p.patientName}</p>
            <p className="text-[10px] text-slate-400 font-normal">PID: {p.patientCode || p.patientId || 'N/A'}</p>
          </div>
      )
    },
    {
      header: 'Doctor',
      render: (p) => (
          <div>
            <p className="text-slate-700 font-medium">Dr. {p.doctorName || 'N/A'}</p>
            <p className="text-[10px] text-slate-400 font-normal">CareFlow Physician</p>
          </div>
      )
    },
    {
      header: 'Notes / Complaints',
      render: (p) => <span className="font-medium text-slate-600 text-xs truncate max-w-[150px] inline-block">{p.notes || 'Routine Checkup'}</span>,
    },
    {
      header: 'Status',
      render: (p) => (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
              p.status === 'CONSULTATION_STARTED' ? 'bg-blue-50 text-blue-600' :
                  p.status === 'VITALS_RECORDED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
          }`}>
          {p.status?.replaceAll('_', ' ') || 'PENDING'}
        </span>
      ),
    },
    {
      header: 'Time',
      render: (p) => <span className="text-slate-500 font-medium text-xs">{dayjs(p.appointmentTime).format('hh:mm A')}</span>
    },
    {
      header: 'Action',
      render: (p) => (
          <button onClick={() => handleStartConsultation(p.id)} className="text-slate-400 hover:text-slate-600 transition-all">
            <Eye className="w-4 h-4 mx-auto" />
          </button>
      ),
      className: 'text-center'
    }
  ];

  return (
      <MainLayout title="Doctor Console" hideTitle>
        {/* 3D Glass sliding reflection effects injection block */}
        <style jsx global>{`
          @keyframes dynamicGlassSlide {
            0% { transform: translateX(-150%) skewX(-25deg); }
            100% { transform: translateX(150%) skewX(-25deg); }
          }
          .animate-glass-shimmer::after {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 40%; height: 100%;
            background: linear-gradient(
                to right,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.35) 50%,
                rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-25deg);
            animation: dynamicGlassSlide 3.5s infinite ease-in-out;
          }
        `}</style>

        <PageSurface
            maxWidthClassName="max-w-[1600px]"
            backgroundClassName="bg-[#F8FAFC]"
            fontClassName="font-inter"
        >
          <div className="space-y-6 p-4 md:p-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-2">
              <div>
                <h1 className="text-xl font-bold text-slate-800">Welcome back, Dr. {user?.fullName || 'Physician'}!</h1>
                <p className="text-sm text-slate-500 mt-0.5">Here&apos;s what&apos;s happening in your clinic queue today.</p>
              </div>

              {/* Action Buttons Zone */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleStartNextConsultation}
                    className="animate-glass-shimmer relative overflow-hidden flex items-center gap-2 px-6 py-3 bg-gradient-to-b from-orange-500 to-orange-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:from-orange-600 hover:to-orange-700 active:translate-y-0.5 active:shadow-[inset_0_4px_6px_rgba(0,0,0,0.2)] transition-all shadow-[0_5px_0_0_#c2410c,0_8px_16px_0_rgba(249,115,22,0.3)] border border-orange-400/20"
                >
                  <Plus className="w-4 h-4 text-white font-black" />
                  <span>Start Next consultation</span>
                </button>

                <Link href="/doctor/patient-queue">
                  <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-600 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                    <ClipboardList className="w-3.5 h-3.5" /> View Full Queue
                  </button>
                </Link>
              </div>
            </div>

            {/* 6-Column KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Total Load<br/>Today</p>
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Patients<br/>Waiting</p>
                  <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Hourglass className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.waiting}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Consultations<br/>Active</p>
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Clock className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.active}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Completed<br/>Visits</p>
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.completed < 10 ? `0${stats.completed}` : stats.completed}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Cancelled<br/>Encounters</p>
                  <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.cancelled}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Today&apos;s Gross<br/>Earnings</p>
                  <span className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><IndianRupee className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">₹{stats.earnings.toLocaleString('en-IN')}</h3>
                </div>
              </div>
            </div>

            {/* MAIN TWIN PANEL LAYOUT FRAME */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT COLLATERAL PANEL: EXTENDED QUEUE CONFIGURATION */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 min-h-[600px] flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-800">Live Active Patient Queue</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative text-xs w-52">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search Patient, Code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none font-medium text-xs text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto min-w-full flex-1">
                    <Table
                        columns={columns}
                        data={filteredQueue}
                        isLoading={loading}
                        emptyMessage="No pending patients found in queue."
                        onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                        activeFilters={columnFilters}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR WIDGET PANELS */}
              <div className="space-y-6">

                {/* Medical History Widget - ALWAYS VISIBLE MINIMUM 3 ENTRIES */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <History className="w-4 h-4 text-orange-600" /> Recent Medical Histories
                    </h3>
                  </div>
                  <div className="space-y-2.5 flex-1 mt-1">
                    {loading && dynamicHistoriesWidgetData.length === 0 ? (
                        <div className="py-4 text-center text-[10px] font-bold text-slate-400 animate-pulse uppercase tracking-widest italic">Syncing History...</div>
                    ) : dynamicHistoriesWidgetData.length > 0 ? (
                        dynamicHistoriesWidgetData.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-none">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-6 bg-orange-500 rounded-sm shrink-0"></span>
                                <div>
                                  <p className="font-semibold text-slate-800">{item.patientName}</p>
                                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">{item.diagnosis || 'Routine Followup'}</p>
                                </div>
                              </div>
                              <span className="font-bold text-slate-400 text-[10px] shrink-0 ml-2">{dayjs(item.appointmentTime).format('DD MMM')}</span>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center">
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Recent History</p>
                        </div>
                    )}
                  </div>

                  <Link href="/doctor/history">
                    <button className="w-full py-2.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-xl mt-3 hover:bg-orange-100 transition-all flex items-center justify-center gap-1 shadow-sm">
                      View All Histories <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>

                {/* Live Queue Counter Progress Radial Ring */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Queue Management Pulse</h3>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="space-y-3 text-xs font-semibold">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 w-20">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          <span className="text-slate-400">Waiting</span>
                        </div>
                        <span className="text-slate-800 font-bold">{stats.waiting}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 w-20">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span className="text-slate-400">In Progress</span>
                        </div>
                        <span className="text-slate-800 font-bold">{stats.active}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 w-20">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-slate-400">Completed</span>
                        </div>
                        <span className="text-slate-800 font-bold">{stats.completed}</span>
                      </div>
                    </div>
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path
                            className="text-orange-600"
                            strokeDasharray={`${Math.round((stats.completed / (stats.total || 1)) * 100)}, 100`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-base font-bold text-slate-800 leading-none">
                          {Math.round((stats.completed / (stats.total || 1)) * 100) || 0}%
                        </p>
                        <p className="text-[8px] text-slate-400 font-bold tracking-tight uppercase mt-0.5">Rate</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integrated Revenue & Earnings Breakdown */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-blue-600" /> Revenue & Earnings Breakdown
                    </h3>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div>
                        <p className="font-bold text-slate-800">Total Valid Encounters</p>
                        <p className="text-[10px] text-slate-400 font-medium">Earned consultations scope</p>
                      </div>
                      <p className="font-bold text-slate-800">{stats.completed} Visits</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Base Consultant Rate</p>
                        <p className="text-[10px] text-slate-400 font-medium">Default structural configuration</p>
                      </div>
                      <p className="font-bold text-blue-600">₹{consultationFee || 0}</p>
                    </div>
                  </div>
                  <Link href="/doctor/earnings">
                    <button className="w-full py-2.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl mt-4 hover:bg-blue-100 transition-all flex items-center justify-center gap-1">
                      Open Earnings Analytics <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </PageSurface>
      </MainLayout>
  );
};
