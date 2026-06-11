'use client';

import {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentSummaryDTO, AppointmentStatus } from '@/types/api';
import { DASHBOARD_REFRESH_INTERVAL, DEFAULT_DEBOUNCE_MS } from '@/utils/constants';

import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useDebounce } from '@/hooks/useDebounce';
import dayjs from '@/lib/dayjs';

export const useReceptionAppointments = () => {
  const hospitalTimezone = useSelector((state: RootState) => state.auth.hospitalTimezone);
  const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL' | 'UPCOMING'>('ALL');
  
  // Column-wise Filter and Sort State
  const [sortState, setSortState] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  
  // Default range: Today's start to 30 days from now's end (local hospital time)
  const initialRange = useMemo(() => {
    if (!hospitalTimezone) return { from: '', to: '' };
    const now = dayjs().tz(hospitalTimezone);
    return {
      from: now.startOf('day').toISOString(),
      to: now.add(30, 'days').endOf('day').toISOString()
    };
  }, [hospitalTimezone]);

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(() => ({
    from: initialRange.from,
    to: initialRange.to
  }));

  // Update column filters if initialRange changes (e.g. timezone loaded)
  // We do this during render to avoid synchronous setState in useEffect
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
  
  const lastFetchKey = useRef<string>('');

  const fetchData = useCallback(async (isBackground = false, filters = activeFilters, colFilters = debouncedColumnFilters, sort = sortState) => {
    if (!hospitalTimezone) return;

    // Determined time range from initial pool or current filters
    const fromParam = colFilters.from || initialRange.from;
    const toParam = colFilters.to || initialRange.to;

    const fetchKey = `${hospitalTimezone}-${JSON.stringify(colFilters)}-${JSON.stringify(sort)}-${JSON.stringify(filters)}`;
    
    // Prevent duplicate calls if params haven't changed (unless it's a background refresh)
    if (!isBackground && lastFetchKey.current === fetchKey) return;
    lastFetchKey.current = fetchKey;

    if (!isBackground) setLoading(true);
    try {
      // For the single source of truth approach, we fetch everything in the range
      // and let the component handle the specific tab filtering.
      const statusesToUse = filters.statuses && filters.statuses.length > 0 
        ? filters.statuses.join(',') 
        : undefined;

      const sortParam = sort ? `${sort.key},${sort.direction}` : undefined;

      // Prepare API column filters (exclude from/to handled separately)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { from: _, to: __, ...apiColFilters } = colFilters;

      const response = await appointmentService.listSummary({
        page: 0,
        size: 500, // Increased size to get the "pool" of appointments for the 30-day window
        from: fromParam,
        to: toParam,
        status: statusesToUse,
        paymentStatus: filters.paymentStatuses?.join(','),
        sort: sortParam,
        ...apiColFilters
      });

      if (response.success && response.data) {
        setAppointments(response.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [hospitalTimezone, debouncedColumnFilters, sortState, activeFilters, initialRange.from, initialRange.to]);

  useEffect(() => {
    const t = setTimeout(() => {
        void fetchData();
    }, 0);
    return () => clearTimeout(t);
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
    applyFilters,
    resetFilters,
    removeFilter,
    refresh: fetchData
  };
};
