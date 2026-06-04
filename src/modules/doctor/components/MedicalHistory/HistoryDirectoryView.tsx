'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { RootState } from '@/state/store';
import { AppointmentResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { PageSurface } from '@/components/ui/PageSurface';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';
import dayjs from '@/lib/dayjs';

// Clean Structure UI Style Lucid Icons Integration
import {
  History, Search, RefreshCw, Filter, ArrowLeft
} from 'lucide-react';

export const HistoryDirectoryView = () => {
  const router = useRouter();
  const { user, hospitalTimezone } = useSelector((state: RootState) => state.auth);

  // Core Operational States
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // Selected state track window
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Pagination State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const hospitalToday = useMemo(() => {
    if (!hospitalTimezone) return new Date().toISOString().split('T')[0];
    return dayjs().tz(hospitalTimezone).format('YYYY-MM-DD');
  }, [hospitalTimezone]);

  const lastMonthStr = useMemo(() => {
    if (!hospitalTimezone) {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split('T')[0];
    }
    return dayjs().tz(hospitalTimezone).subtract(1, 'month').format('YYYY-MM-DD');
  }, [hospitalTimezone]);

  const [startDate, setStartDate] = useState(lastMonthStr);
  const [endDate, setEndDate] = useState(hospitalToday);

  // Handlers for Date Filters
  const handleStartDateChange = (val: string) => {
    if (!val) return;
    if (val > hospitalToday) {
      triggerGlobalToast('Start date cannot be in the future', 'warning');
      return;
    }
    setStartDate(val);
    if (endDate && val > endDate) setEndDate(val);
    setPage(0);
  };

  const handleEndDateChange = (val: string) => {
    if (!val) return;
    if (val > hospitalToday) {
      triggerGlobalToast('End date cannot be in the future', 'warning');
      return;
    }
    setEndDate(val);
    if (startDate && val < startDate) setStartDate(val);
    setPage(0);
  };

  // API Consumer Data Fetcher
  const fetchData = useCallback(async () => {
    if (!user || !hospitalTimezone) return;

    try {
      setLoading(true);
      const fromUTC = dayjs(startDate).tz(hospitalTimezone).startOf('day').toISOString();
      const toUTC = dayjs(endDate).tz(hospitalTimezone).endOf('day').toISOString();

      const response = await appointmentService.list({
        page: 0,
        size: 1000,
        from: fromUTC,
        to: toUTC,
        doctorId: user.id
      });

      if (!response.success || !response.data) {
        setAppointments([]);
        return;
      }

      const doctorAppointments = response.data.content.filter(app =>
          app.doctorId === user.id ||
          app.doctorName.toLowerCase().includes(user.fullName.toLowerCase())
      );
      setAppointments(doctorAppointments);
    } catch (error) {
      console.error(error);
      triggerGlobalToast('Failed to fetch medical histories', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, hospitalTimezone, startDate, endDate]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void fetchData();
    });
  }, [fetchData]);

  // FIXED INTERNALS: Realtime Reactive Client Filtering Array Layer
  const filteredAppointments = useMemo(() => {
    let result = appointments.filter(app => {
      const appDate = dayjs(app.appointmentTime).format('YYYY-MM-DD');
      return appDate >= startDate && appDate <= endDate;
    });

    // STRICT CHECK: Dropdown filters check mechanism logic
    if (statusFilter !== 'ALL') {
      result = result.filter(app => {
        // Safe mapping configuration array to catch potential data variants from backend layers
        const currentStatus = app.status ? app.status.toUpperCase().trim() : '';
        const targetFilter = statusFilter.toUpperCase().trim();
        return currentStatus === targetFilter;
      });
    }

    // Text query input engine
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(app =>
          app.patientName?.toLowerCase().includes(term) ||
          app.id?.toString().toLowerCase().includes(term) ||
          app.patientCode?.toLowerCase().includes(term)
      );
    }

    return result.toSorted((a, b) => b.appointmentTime.localeCompare(a.appointmentTime));
  }, [appointments, startDate, endDate, statusFilter, searchTerm]);

  // Pagination Slice
  const paginatedAppointments = useMemo(() => {
    const start = page * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, page, pageSize]);

  // Table Core Structural Grid Definition
  const columns: Column<AppointmentResponse>[] = [
    {
      header: 'Date',
      render: (p) => (
          <span className="text-slate-600 font-semibold text-xs">
          {dayjs(p.appointmentTime).format('DD MMM YYYY')}
        </span>
      )
    },
    {
      header: 'Patient Profile',
      render: (p) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 font-bold uppercase text-slate-400 text-xs">
              {p.patientName.split(' ').map((name) => name[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-snug">{p.patientName}</p>
              <p className="text-[10px] text-slate-400 font-medium">PID: {p.patientCode || p.patientId || 'N/A'}</p>
            </div>
          </div>
      )
    },
    {
      header: 'Diagnosis / Chief Complaint',
      render: (p) => (
          <span className="font-medium text-slate-700 text-xs truncate max-w-[240px] inline-block">
          {p.diagnosis || p.notes || 'Routine Clinical Follow-up'}
        </span>
      )
    },
    {
      header: 'Status',
      render: (p) => {
        const variants: Record<string, string> = {
          COMPLETED: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          CANCELLED: 'bg-rose-50 text-rose-600 border border-rose-100',
          CONSULTATION_STARTED: 'bg-blue-50 text-blue-600 border border-blue-100',
          SCHEDULED: 'bg-slate-50 text-slate-600 border border-slate-200',
          VITALS_RECORDED: 'bg-orange-50 text-orange-600 border border-orange-100'
        };

        return (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${variants[p.status] || 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
            {p.status?.replaceAll('_', ' ') || 'COMPLETED'}
          </span>
        );
      }
    },
    {
      header: 'Action',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (p) => (
          <button
              onClick={() => router.push(`/doctor/active-consultation?appointmentId=${p.id}`)}
              className="px-3 py-1 bg-white text-slate-600 border border-slate-200 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm"
              title="Review Case File"
          >
            Review Case
          </button>
      )
    }
  ];

  return (
      <MainLayout title="Medical History Directory" hideTitle>
        <PageSurface
            maxWidthClassName="max-w-[1600px]"
            backgroundClassName="bg-[#F8FAFC]"
            fontClassName="font-inter"
        >
          <div className="space-y-6 p-4 md:p-8">

            {/* Top Control Header Block */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push('/doctor/dashboard')}
                    className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 bg-white transition-all shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Medical History Directory</h1>
                  <p className="text-sm text-slate-500 mt-0.5">Archive list of completed diagnoses and past patient case encounters.</p>
                </div>
              </div>

              {/* Date Range Controllers Strip */}
              <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full xl:w-auto">
                <div className="flex items-center gap-4 px-4 py-1.5 bg-slate-50/80 rounded-xl border border-slate-100/80 flex-1 sm:flex-initial">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Start Date</span>
                    <input
                        type="date"
                        value={startDate}
                        max={hospitalToday}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">End Date</span>
                    <input
                        type="date"
                        value={endDate}
                        max={hospitalToday}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-3.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-orange-600/10 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Update
                </button>
              </div>
            </div>

            {/* Master Table Structure Wrapper Layer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col min-h-[550px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-orange-600" /> Patient Encounter Logs
                </h3>

                {/* Filtering Block Area */}
                <div className="flex items-center gap-2">
                  <div className="relative text-xs w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search history by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none font-medium text-xs text-slate-700"
                    />
                  </div>

                  {/* DYNAMIC DROPDOWN FIXED CONTROL MODULE */}
                  <div className="relative flex items-center bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all px-3 py-1.5 gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(0); // Index resets to show from top layer on configuration mutation
                        }}
                        className="bg-transparent outline-none text-xs font-bold uppercase cursor-pointer pr-1 appearance-none"
                        aria-label="Filter encounters by deployment state"
                    >
                      <option value="ALL">ALL STATUSES</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="CONSULTATION_STARTED">IN PROGRESS</option>
                      <option value="VITALS_RECORDED">VITALS RECORDED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Core Data Engine Table Viewport */}
              <div className="overflow-x-auto min-w-full flex-1">
                <Table
                    columns={columns}
                    data={paginatedAppointments}
                    isLoading={loading}
                    loadingMessage="Retrieving historical case logs matching constraints..."
                    emptyMessage="No medical encounters found matching specified filters."
                    onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                    activeFilters={columnFilters}
                />
              </div>

              {/* Pagination Segment */}
              <div className="border-t border-slate-50 pt-2">
                <Pagination
                    page={page}
                    totalElements={filteredAppointments.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    label="historical logs"
                />
              </div>
            </div>

          </div>
        </PageSurface>
      </MainLayout>
  );
};