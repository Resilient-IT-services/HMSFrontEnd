'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doctorService } from '@/services/doctorService';
import { DoctorStaffResponse, SessionInfo } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

const defaultDepartmentOptions = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology',
  'Obstetrics',
  'Dermatology',
  'Ophthalmology',
  'ENT (Ear, Nose, Throat)',
  'General Medicine',
];

export const useReceptionDoctors = () => {
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<SessionInfo[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const department = selectedDepartment || undefined;
      const res = await doctorService.list(0, 100, debouncedSearchTerm, department);
      if (res.success && res.data) {
        const content = res.data.content;
        const filteredDoctors = department
          ? content.filter((doctor) => doctor.departmentName.toLowerCase() === department.toLowerCase())
          : content;
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
      const res = await doctorService.list(0, 100);
      if (res.success && res.data) {
        const departments = [
          ...new Set(
            [
              ...defaultDepartmentOptions,
              ...res.data.content
              .map((doctor) => doctor.departmentName)
              .filter(Boolean),
            ]
          )
        ].toSorted((a, b) => a.localeCompare(b));
        setDepartmentOptions(departments);
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
    const trigger = async () => {
      if (selectedDoctor) {
        await fetchAvailability(selectedDoctor.doctorId, selectedDate);
      }
    };
    void trigger();
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
