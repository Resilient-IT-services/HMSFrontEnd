'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { RootState } from '@/state/store';
import { AppointmentResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Pagination } from '@/components/ui/Pagination';
import { EarningsVisitHistory } from '../components/Earnings/EarningsVisitHistory';
import { useConsultationFee } from '@/hooks/useConsultationFee';
import { APPOINTMENT_STATUS_METADATA, DEFAULT_PAGE_SIZE } from '@/utils/constants';
import dayjs from '@/lib/dayjs';

// Pharmacy Style Clean Layout & Lucid Icons Integration
import {
  FileText, Group, CheckCircle2, XCircle, IndianRupee, RefreshCw
} from 'lucide-react';

export const EarningsPage = () => {
  const { user, hospitalTimezone } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const consultationFee = useConsultationFee();

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

  const handleStartDateChange = (val: string) => {
    if (!val) return;
    if (val > hospitalToday) {
      triggerGlobalToast('Start date cannot be in the future', 'warning');
      return;
    }
    setStartDate(val);
    if (endDate && val > endDate) {
      setEndDate(val);
    }
    setPage(0);
  };

  const handleEndDateChange = (val: string) => {
    if (!val) return;
    if (val > hospitalToday) {
      triggerGlobalToast('End date cannot be in the future', 'warning');
      return;
    }
    setEndDate(val);
    if (startDate && val < startDate) {
      setStartDate(val);
    }
    setPage(0);
  };

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
      triggerGlobalToast('Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, hospitalTimezone, startDate, endDate]);

  useEffect(() => {
    const trigger = async () => {
      await fetchData();
    };
    void trigger();
  }, [fetchData]);

  const filteredAppointments = useMemo(() => {
    return appointments
        .filter(app => {
          const appDate = app.appointmentTime.split('T')[0];
          return appDate >= startDate && appDate <= endDate;
        })
        .toSorted((a, b) => b.appointmentTime.localeCompare(a.appointmentTime));
  }, [appointments, startDate, endDate]);

  const paginatedAppointments = useMemo(() => {
    const start = page * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, page, pageSize]);

  const stats = useMemo(() => {
    const earnedAppointments = filteredAppointments.filter(
        app => app.status !== 'CANCELLED' && app.status !== 'PAYMENT_PENDING'
    );

    return {
      totalVisits: filteredAppointments.length,
      earnedVisits: earnedAppointments.length,
      totalEarnings: typeof consultationFee === 'number' ? earnedAppointments.length * consultationFee : 0,
      cancelled: filteredAppointments.filter(app => app.status === 'CANCELLED').length,
    };
  }, [filteredAppointments, consultationFee]);

  const statusCaptions = useMemo(() => {
    const captions: Record<string, string> = {};
    Object.entries(APPOINTMENT_STATUS_METADATA).forEach(([key, value]) => {
      captions[key] = value.label;
    });
    return captions;
  }, []);

  return (
      <MainLayout title="My Earnings" hideTitle>
        <PageSurface
            maxWidthClassName="max-w-[1600px]"
            backgroundClassName="bg-[#F8FAFC]"
            fontClassName="font-inter"
        >
          <div className="space-y-6 p-4 md:p-8">

            {/* Pharmacy Styled Top Layout Header Control */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-100 pb-2">
              <PageHeading
                  title="Earnings Analytics"
                  description="Detailed breakdown of your revenue and patient encounters."
                  className="mb-0"
              />

              {/* Structured Date Sync Track Container */}
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

            {/* Dynamic 4-Column Structured Metric KPI Cards Block */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Total Earnings<br />Summary</p>
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><IndianRupee className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">
                    {stats.totalEarnings === 0 ? '0' : `₹${stats.totalEarnings.toLocaleString('en-IN')}`}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Total Visits<br />Encounters</p>
                  <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Group className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.totalVisits}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Earned Visits<br />Settled</p>
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.earnedVisits}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Cancelled<br />Visits</p>
                  <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><XCircle className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.cancelled}</h3>
                </div>
              </div>
            </div>

            {/* Core Master History Data Table Viewport Block */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" /> Revenue Breakdown List
                </h3>
              </div>

              <div className="overflow-x-auto min-w-full flex-1">
                <EarningsVisitHistory
                    loading={loading}
                    filteredAppointments={paginatedAppointments}
                    consultationFee={consultationFee}
                    statusCaptions={statusCaptions}
                />
              </div>

              {/* Flat Responsive Table Pagination Section */}
              <div className="border-t border-slate-50 pt-3">
                <Pagination
                    page={page}
                    totalElements={filteredAppointments.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    label="encounters"
                />
              </div>
            </div>

          </div>
        </PageSurface>
      </MainLayout>
  );
};