'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { doctorService } from '@/services/doctorService';
import { catalogService } from '@/services/catalogService';
import { DoctorStaffResponse, SessionInfo } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';
import { hasDepartment } from '@/utils/staffDisplay';
import { getLocalStartOfDayISO } from '@/utils/dateValidator';
import dayjs from '@/lib/dayjs';

export const useReceptionDoctors = () => {
  const { hospitalTimezone } = useSelector((state: RootState) => state.auth);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<string | undefined>();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedColumnFilters = useDebounce(columnFilters, 300);
  
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(getLocalStartOfDayISO(undefined, hospitalTimezone));
  const [availability, setAvailability] = useState<SessionInfo[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const department = selectedDepartment || debouncedColumnFilters.department || undefined;
      const res = await doctorService.list({ 
        page: 0, 
        size: 100, 
        name: debouncedSearchTerm || debouncedColumnFilters.fullName, 
        department,
        sort,
        ...debouncedColumnFilters
      });
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
        setDepartmentOptions(res.data.toSorted((a, b) => a.localeCompare(b)));
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
      const searchDate = getLocalStartOfDayISO(date, hospitalTimezone);
      const res = await doctorService.getAvailability(doctorId, searchDate);
      if (res.success && res.data) {
        setAvailability(res.data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch availability', error);
    } finally {
      setLoadingSchedule(false);
    }
  }, [hospitalTimezone]);

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
    setSelectedDate(getLocalStartOfDayISO(undefined, hospitalTimezone));
  };

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = dayjs().tz(hospitalTimezone || undefined).add(i, 'day');
      const iso = getLocalStartOfDayISO(d.toDate(), hospitalTimezone);
      const label = i === 0 ? 'Today' : d.format('ddd');
      const day = d.date();
      return { iso, label, day };
    });
  }, [hospitalTimezone]);

  return {
    doctors,
    loading,
    searchTerm,
    setSearchTerm,
    selectedDepartment,
    setSelectedDepartment,
    columnFilters,
    setColumnFilters,
    sort,
    setSort,
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
