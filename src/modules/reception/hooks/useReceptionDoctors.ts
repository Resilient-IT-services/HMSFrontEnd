'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doctorService } from '@/services/doctorService';
import { DoctorStaffResponse, SessionInfo } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

export const useReceptionDoctors = () => {
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<SessionInfo[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await doctorService.list(0, 100, debouncedSearchTerm);
      if (res.success && res.data) {
        setDoctors(res.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch doctors', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const fetchAvailability = useCallback(async (doctorId: string, date: string) => {
    try {
      setLoadingSchedule(true);
      const res = await doctorService.getAvailability(doctorId, date);
      if (res.success && res.data) {
        setAvailability(res.data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch availability', error);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailability(selectedDoctor.doctorId, selectedDate);
    }
  }, [selectedDoctor, selectedDate, fetchAvailability]);

  const viewSchedule = (doctor: DoctorStaffResponse) => {
    setSelectedDoctor(doctor);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const day = d.getDate();
      return { iso, label, day };
    });
  }, []);

  return {
    doctors,
    loading,
    searchTerm,
    setSearchTerm,
    selectedDoctor,
    setSelectedDoctor,
    selectedDate,
    setSelectedDate,
    availability,
    loadingSchedule,
    dateOptions,
    viewSchedule,
    refresh: fetchDoctors
  };
};
