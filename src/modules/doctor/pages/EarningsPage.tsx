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
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MetricsGrid } from '@/components/ui/MetricsGrid';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EarningsVisitHistory } from '../components/Earnings/EarningsVisitHistory';
import { useConsultationFee } from '@/hooks/useConsultationFee';
import { APPOINTMENT_STATUS_METADATA, DEFAULT_PAGE_SIZE } from '@/utils/constants';
import dayjs from '@/lib/dayjs';

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
    // If new start date is after current end date, push end date forward
    if (endDate && val > endDate) {
      setEndDate(val);
    }
    setPage(0); // Reset page on filter change
  };

  const handleEndDateChange = (val: string) => {
    if (!val) return;
    if (val > hospitalToday) {
      triggerGlobalToast('End date cannot be in the future', 'warning');
      return;
    }
    setEndDate(val);
    // If new end date is before current start date, pull start date backward
    if (startDate && val < startDate) {
      setStartDate(val);
    }
    setPage(0); // Reset page on filter change
  };

  const fetchData = useCallback(async () => {
    if (!user || !hospitalTimezone) return;

    try {
      setLoading(true);
      // We want to fetch a broad range or just enough for the current filters
      // For earnings, we might want to fetch everything and then filter client-side, 
      // or pass the from/to to the backend if the API supports it.
      // The current backend API list supports from/to.
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

  const metricItems = [
    { label: 'Total Earnings', value: stats.totalEarnings === 0 ? '0' : `₹${stats.totalEarnings.toLocaleString()}`, variant: 'indigo' as const, icon: 'payments' },
    { label: 'Total Visits', value: stats.totalVisits.toString(), variant: 'orange' as const, icon: 'group' },
    { label: 'Earned Visits', value: stats.earnedVisits.toString(), variant: 'emerald' as const, icon: 'check_circle' },
    { label: 'Cancelled', value: stats.cancelled.toString(), variant: 'red' as const, icon: 'cancel' }
  ];

  return (
    <MainLayout title="My Earnings" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
          <PageHeading
            title="Earnings Analytics"
            description="Detailed breakdown of your revenue and patient encounters."
            className="mb-0"
          />

          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Start Date</span>
                <input 
                  type="date" 
                  value={startDate} 
                  max={hospitalToday}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                />
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">End Date</span>
                <input 
                  type="date" 
                  value={endDate} 
                  max={hospitalToday}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                />
              </div>
            </div>
            <Button
              onClick={fetchData}
              icon="sync"
              variant="primary"
              size="sm"
              className="rounded-xl shadow-md shadow-orange-600/10"
              isLoading={loading}
            >
              Update
            </Button>
          </div>
        </div>

        <MetricsGrid items={metricItems} className="mb-8 hidden md:grid" />

        <Card 
          title="Revenue Breakdown  "
          className="overflow-hidden mb-12 p-4"
        >
          <EarningsVisitHistory 
            loading={loading}
            filteredAppointments={paginatedAppointments}
            consultationFee={consultationFee}
            statusCaptions={statusCaptions}
          />
          
          <Pagination
            page={page}
            totalElements={filteredAppointments.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            label="encounters"
          />
        </Card>
        </div>
      </PageSurface>
    </MainLayout>
  );};
