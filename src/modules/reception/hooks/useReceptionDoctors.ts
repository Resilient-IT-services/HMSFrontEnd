'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doctorService } from '@/services/doctorService';
import { catalogService } from '@/services/catalogService';
import { DoctorStaffResponse, SessionInfo } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';
import { hasDepartment } from '@/utils/staffDisplay';
import { getLocalStartOfDayISO } from '@/utils/dateValidator';

export const useReceptionDoctors = () => {
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(getLocalStartOfDayISO());
  const [availability, setAvailability] = useState<SessionInfo[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const department = selectedDepartment || undefined;
      const res = await doctorService.list(0, 100, debouncedSearchTerm, department);
      if (res.success && res.data) {
        const content = res.data.content;
        // The backend filters by name and department if provided. 
        // We keep the client-side filter as a fallback for complex multi-department matching
        // if the backend only matches primary department.
        const filteredDoctors = department ? content.filter((doctor) => hasDepartment(doctor, department)) : content;
        setDoctors(filteredDoctors);
      }
    } catch (error) {
      console.error('Failed to fetch doctors', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, selectedDepartment]);

  const fetchDepartmentOptions = useCallback(async () => {
    try {
      const res = await catalogService.getDepartments();
      if (res.success && res.data) {
        setDepartmentOptions(res.data.sort((a, b) => a.localeCompare(b)));
      }
    } catch (error) {
      console.error('Failed to fetch doctor departments', error);
    }
  }, []);

  useEffect(() => {
    const trigger = async () => {
      await fetchDoctors();
    };
    void trigger();
  }, [fetchDoctors]);

  useEffect(() => {
    const trigger = async () => {
      await fetchDepartmentOptions();
    };
    void trigger();
  }, [fetchDepartmentOptions]);

  const fetchAvailability = useCallback(async (doctorId: string, date: string) => {
    try {
      setLoadingSchedule(true);
      const searchDate = getLocalStartOfDayISO(date);
      const res = await doctorService.getAvailability(doctorId, searchDate);
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
    const trigger = async () => {
      if (selectedDoctor) {
        await fetchAvailability(selectedDoctor.doctorId, selectedDate);
      }
    };
    void trigger();
  }, [selectedDoctor, selectedDate, fetchAvailability]);

  const viewSchedule = (doctor: DoctorStaffResponse) => {
    setSelectedDoctor(doctor);
    setSelectedDate(getLocalStartOfDayISO());
  };

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = getLocalStartOfDayISO(d);
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
    selectedDepartment,
    setSelectedDepartment,
    departmentOptions,
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
