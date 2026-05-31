'use client';

import {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentSummaryDTO, AppointmentStatus } from '@/types/api';
import { sortByToken } from '@/utils/tokenHelper';
import { DASHBOARD_REFRESH_INTERVAL, DEFAULT_DEBOUNCE_MS } from '@/utils/constants';

import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useDebounce } from '@/hooks/useDebounce';
import { getHospitalDayRangeUTC } from '@/utils/dateValidator';
import dayjs from '@/lib/dayjs';

export const useReceptionAppointments = () => {
  const hospitalTimezone = useSelector((state: RootState) => state.auth.hospitalTimezone);
  const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL' | 'UPCOMING'>('ALL');
  
  // Column-wise Filter and Sort State
  const [sortState, setSortState] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  
  // Default range: Midnight to now (local hospital time)
  const initialRange = useMemo(() => {
    if (!hospitalTimezone) return { from: '', to: '' };
    const now = dayjs().tz(hospitalTimezone);
    return {
      from: now.startOf('day').toISOString(),
      to: now.toISOString()
    };
  }, [hospitalTimezone]);

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(() => ({
    from: initialRange.from,
    to: initialRange.to
  }));

  // Update column filters if initialRange changes (e.g. timezone loaded)
  // We do this during render to avoid cascading renders in React 19
  if (initialRange.from && !columnFilters.from) {
      setColumnFilters(prev => ({
          ...prev,
          from: initialRange.from,
          to: initialRange.to
      }));
  }

  const debouncedColumnFilters = useDebounce(columnFilters, DEFAULT_DEBOUNCE_MS);

  // Advanced Filter State (legacy/modal)
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

  const lastFetchKey = useRef<string>('');

  const fetchData = useCallback(async (isBackground = false, filters = activeFilters, colFilters = debouncedColumnFilters, sort = sortState) => {
    if (!hospitalTimezone) return;

    // Determine time range: Priority to column filters, fallback to today's range
    const todayRange = getHospitalDayRangeUTC(hospitalTimezone);
    const fromParam = colFilters.from || (statusFilter === 'UPCOMING' ? undefined : todayRange.from);
    const toParam = colFilters.to || (statusFilter === 'UPCOMING' ? undefined : todayRange.to);

    const fetchKey = `${hospitalTimezone}-${statusFilter}-${JSON.stringify(colFilters)}-${JSON.stringify(sort)}-${JSON.stringify(filters)}`;
    
    // Prevent duplicate calls if params haven't changed (unless it's a background refresh)
    if (!isBackground && lastFetchKey.current === fetchKey) return;
    lastFetchKey.current = fetchKey;

    if (!isBackground) setLoading(true);
    try {
      const statusesToUse = filters.statuses && filters.statuses.length > 0 
        ? filters.statuses.join(',') 
        : (statusFilter === 'ALL' || statusFilter === 'UPCOMING' ? undefined : statusFilter);

      const sortParam = sort ? `${sort.key},${sort.direction}` : undefined;

      // Prepare API column filters (exclude from/to handled separately)
      const { from: _from, to: _to, ...apiColFilters } = colFilters;

      const [appRes, statsRes] = await Promise.all([
        appointmentService.listSummary({
          page: 0,
          size: 100,
          from: fromParam,
          to: toParam,
          status: statusesToUse,
          paymentStatus: filters.paymentStatuses?.join(','),
          sort: sortParam,
          ...apiColFilters
        }),
        appointmentService.getStats(todayRange.from, todayRange.to)
      ]);

      if (appRes.success && appRes.data) {
        setAppointments(appRes.data.content);
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
  }, [statusFilter, activeFilters, debouncedColumnFilters, sortState, hospitalTimezone]);

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
    setColumnFilters({
      from: initialRange.from,
      to: initialRange.to
    });
    setSortState(null);
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

  return {
    appointments,
    loading,
    statusFilter,
    setStatusFilter,
    sortState,
    setSortState,
    columnFilters,
    setColumnFilters,
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
