'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { AppointmentSummaryDTO, DoctorStaffResponse, AppointmentStatus } from '@/types/api';
import { sortByToken } from '@/utils/tokenHelper';

import { useAutoRefresh } from '@/hooks/useAutoRefresh';

export const useReceptionAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
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
      
      const dateToUse = (statusFilter === 'UPCOMING' ? undefined : today);
      
      const statusesToUse = filters.statuses?.length > 0 
        ? filters.statuses.join(',') 
        : (statusFilter === 'ALL' || statusFilter === 'UPCOMING' ? undefined : statusFilter);

      const [appRes, docRes, statsRes] = await Promise.all([
        appointmentService.listSummary(
          0, 100, 
          searchTerm, 
          dateToUse,
          undefined,
          statusesToUse,
          filters.paymentStatuses?.join(',')
        ),
        doctorService.list(0, 100),
        appointmentService.getStats(today)
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
          walkIn: (statusStats['WALK_IN'] as any) || 0,
          upcoming: statsRes.data.upcoming || 0,
          paymentPending: (statusStats['PAYMENT_PENDING'] as any) || 0,
          waitingForVitals: (statusStats['WAITING_FOR_VITALS'] as any) || 0,
          completed: (statusStats['COMPLETED'] as any) || 0,
          cancelled: (statusStats['CANCELLED'] as any) || 0,
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
  }, [fetchData]);

  useAutoRefresh(fetchData, 30_000);

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
    updated[key] = Array.isArray(updated[key]) ? updated[key].filter((v: string) => v !== value) : '';
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
