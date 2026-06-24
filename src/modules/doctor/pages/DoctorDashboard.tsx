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
import { Table, Column } from '@/components/ui/Table';
import { PageSurface } from '@/components/ui/PageSurface';
import { useConsultationFee } from '@/hooks/useConsultationFee';
import { DASHBOARD_REFRESH_INTERVAL, DEFAULT_PAGE_SIZE, DEFAULT_DEBOUNCE_MS } from '@/utils/constants';
import { getHospitalDayRangeUTC } from '@/utils/dateValidator';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import Link from 'next/link';
import dayjs from '@/lib/dayjs';

// Pharmacy Style Lucid Icons Integration
import { MetricCard } from '@/components/ui/MetricCard';
import {
  FileText, Hourglass, CheckCircle2,
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
        // Global broad range pull for tracking histories
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

  // Exact 3 entries tracking logic for recent histories
  const dynamicHistoriesWidgetData = useMemo(() => {
    return recentHistories.slice(0, 3);
  }, [recentHistories]);

  // Metrics Processors
  const stats = useMemo(() => {
    const waiting = appointments.filter((a) => a.status === 'PAID' || a.status === 'VITALS_RECORDED').length;
    const active = appointments.filter((a) => a.status === 'CONSULTATION_STARTED').length;
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;

    // Explicit condition logic mapping: Sum of waiting, active and completed
    const totalLoadToday = waiting + active + completed;

    // Calculation condition logic formula: Use API revenue summary if available, fallback to manual calculation
    const feeRate = typeof consultationFee === 'number' ? consultationFee : 0;
    const earnings = revenueSummary?.totalRevenue ?? (completed * feeRate);

    // Percentage Calculation for Multi-Segment Ring
    const totalForRing = totalLoadToday || 1;
    const waitingPercent = (waiting / totalForRing) * 100;
    const activePercent = (active / totalForRing) * 100;
    const completedPercent = (completed / totalForRing) * 100;

    return {
      total: totalLoadToday,
      waiting,
      active,
      completed,
      earnings,
      waitingPercent,
      activePercent,
      completedPercent
    };
    }, [appointments, consultationFee, revenueSummary]);

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
      className: 'break-words whitespace-normal text-center',
      render: (p) => (
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-mono ${
              p.status === 'CONSULTATION_STARTED' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
          }`}>
          {formatToken(p)}
        </span>
      )
    },
    {
      header: 'Patient',
      className: 'break-words whitespace-normal max-w-[120px] text-center',
      render: (p) => (
          <div>
            <p className="font-semibold text-slate-800 text-xs">{p.patientName}</p>
            <p className="text-[9px] text-slate-400 font-normal">PID: {p.patientCode || p.patientId || 'N/A'}</p>
          </div>
      )
    },
    {
      header: 'Doctor',
      className: 'break-words whitespace-normal text-center',
      render: (p) => (
          <div>
            <p className="text-slate-700 font-medium text-xs">Dr. {p.doctorName || 'N/A'}</p>
          </div>
      )
    },
    {
      header: 'Notes / Complaints',
      className: 'break-words whitespace-normal max-w-[150px] text-center',
      render: (p) => <span className="font-medium text-slate-600 text-xs inline-block">{p.notes || 'Routine Checkup'}</span>,
    },
    {
      header: 'Status',
      className: 'break-words whitespace-normal max-w-[100px] text-center',
      render: (p) => (
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide ${
              p.status === 'CONSULTATION_STARTED' ? 'bg-blue-50 text-blue-600' :
                  p.status === 'VITALS_RECORDED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
          }`}>
          {p.status?.replaceAll('_', ' ') || 'PENDING'}
        </span>
      ),
    },
    {
      header: 'Time',
      className: 'break-words whitespace-normal text-center',
      render: (p) => <span className="text-slate-500 font-medium text-[10px]">{dayjs(p.appointmentTime).format('hh:mm A')}</span>
    },
    {
      header: 'Action',
      className: 'text-center break-words whitespace-normal',
      render: (p) => (
          <div className="flex items-center justify-center min-h-[32px]">
            {/* Conditional Check applied to eliminate extra eye icons when resume button is present */}
            {p.status === 'CONSULTATION_STARTED' ? (
                <button
                    onClick={() => handleStartConsultation(p.id)}
                    className="px-2 py-1 bg-orange-50 text-orange-600 border border-orange-200 text-[9px] font-bold uppercase tracking-wider rounded-full hover:bg-orange-100 active:scale-95 transition-all shadow-sm shrink-0"
                >
                  Resume
                </button>
            ) : (
                <button
                    onClick={() => handleStartConsultation(p.id)}
                    className="text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center p-1 rounded-md hover:bg-slate-100"
                    title="View Patient Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
            )}
          </div>
      )
    }
  ];

  return (
      <MainLayout title="Doctor Console" hideTitle>
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
          @media (max-width: 1024px) {
            table {
              font-size: 11px;
            }
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

            {/* Reconfigured 5-Column Grid Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

              {/* LEFT PANEL: PATIENT QUEUE */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 min-h-[600px] flex flex-col max-w-full w-full overflow-hidden">
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

                  <div className="w-full max-w-full overflow-hidden flex-1">
                    <Table
                        columns={columns}
                        data={filteredQueue}
                        isLoading={loading}
                        emptyMessage="No pending patients found in queue."
                        onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                        activeFilters={columnFilters}
                        rowClassName="border-b border-slate-50 last:border-none"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR WIDGET PANELS */}
              <div className="space-y-6">

                {/* Medical History Widget */}
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

                {/* Live Queue Counter Progress Pie Chart */}
                <MetricCard 
                  label="Queue Management Pulse"
                  layout="chart"
                  chartData={{
                    waiting: stats.waiting,
                    active: stats.active,
                    completed: stats.completed
                  }}
                  subValue={`${Math.round((stats.completed / (stats.total || 1)) * 100) || 0}% Completion Rate`}
                />

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