'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { AppointmentSummaryDTO, DoctorStaffResponse, AppointmentStatus } from '@/types/api';
import { sortByToken } from '@/utils/tokenHelper';
import { DASHBOARD_REFRESH_INTERVAL, DEFAULT_DEBOUNCE_MS } from '@/utils/constants';

import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useDebounce } from '@/hooks/useDebounce';
import { getHospitalDayRangeUTC } from '@/utils/dateValidator';
import dayjs from '@/lib/dayjs';

export const useReceptionAppointments = () => {
  const { hospitalTimezone } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL' | 'UPCOMING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, DEFAULT_DEBOUNCE_MS);

  // Advanced Filter State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    statuses: [] as string[],
    paymentStatuses: [] as string[]
  });

  const [activeFilters, setActiveFilters] = useState<{ statuses?: string[]; paymentStatuses?: string[] }>({});
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    upcoming: 0,
    paymentPending: 0,
    waitingForVitals: 0,
    completed: 0,
    cancelled: 0,
  });

  const fetchData = useCallback(async (isBackground = false, filters = activeFilters) => {
    if (!isBackground) setLoading(true);
    try {
      if (!hospitalTimezone) return;

      const { from, to } = getHospitalDayRangeUTC(hospitalTimezone);
      
      const fromParam = (statusFilter === 'UPCOMING' ? undefined : from);
      const toParam = (statusFilter === 'UPCOMING' ? undefined : to);
      
      const statusesToUse = filters.statuses && filters.statuses.length > 0 
        ? filters.statuses.join(',') 
        : (statusFilter === 'ALL' || statusFilter === 'UPCOMING' ? undefined : statusFilter);

      const [appRes, docRes, statsRes] = await Promise.all([
        appointmentService.listSummary(
          0, 100, 
          debouncedSearchTerm, 
          fromParam,
          toParam,
          undefined,
          statusesToUse,
          filters.paymentStatuses?.join(',')
        ),
        doctorService.list(0, 100),
        appointmentService.getStats(from, to)
      ]);

      if (appRes.success && appRes.data) {
        setAppointments(appRes.data.content);
      }
      if (docRes.success && docRes.data) {
        setDoctors(docRes.data.content);
      }

      if (statsRes.success && statsRes.data) {
        const statusStats = statsRes.data.byStatus;
        setStats({
          total: statsRes.data.total,
          inProgress: statusStats['CONSULTATION_STARTED'] || 0,
          upcoming: statsRes.data.upcoming || 0,
          paymentPending: statusStats['PAYMENT_PENDING'] || 0,
          waitingForVitals: statusStats['PAID'] || 0,
          completed: statusStats['COMPLETED'] || 0,
          cancelled: statusStats['CANCELLED'] || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [statusFilter, debouncedSearchTerm, activeFilters]);

  useEffect(() => {
    const trigger = async () => {
      await fetchData();
    };
    void trigger();
  }, [fetchData]);

  useAutoRefresh(fetchData, DASHBOARD_REFRESH_INTERVAL);

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
    if (key === 'statuses' || key === 'paymentStatuses') {
      const arr = updated[key] || [];
      updated[key] = arr.filter((v: string) => v !== value);
    }
    setActiveFilters(updated);
    setAdvancedFilters({
      statuses: updated.statuses || [],
      paymentStatuses: updated.paymentStatuses || []
    });
  };

  const filteredAppointments = useMemo(() => {
    if (!hospitalTimezone) return [];
    
    const hospitalToday = dayjs().tz(hospitalTimezone).format('YYYY-MM-DD');
    
    const base = appointments.filter(app => {
      const appHospitalDate = dayjs(app.appointmentTime).tz(hospitalTimezone).format('YYYY-MM-DD');
      const isToday = appHospitalDate === hospitalToday;
      const isUpcoming = appHospitalDate > hospitalToday;

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
  }, [appointments, statusFilter, activeFilters, hospitalTimezone]);

  return {
    appointments: filteredAppointments,
    doctors,
    loading,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    isFilterModalOpen,
    setIsFilterModalOpen,
    advancedFilters,
    setAdvancedFilters,
    activeFilters,
    stats,
    applyFilters,
    resetFilters,
    removeFilter,
    refresh: fetchData
  };
};
