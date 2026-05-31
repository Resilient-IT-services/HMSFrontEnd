'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { RootState } from '@/state/store';
import { AppointmentResponse, PatientResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { sortByToken } from '@/utils/tokenHelper';
import { DASHBOARD_REFRESH_INTERVAL } from '@/utils/constants';
import { getHospitalDayRangeUTC } from '@/utils/dateValidator';
import { useDebounce } from '@/hooks/useDebounce';
import dayjs from '@/lib/dayjs';

import { useAutoRefresh } from '@/hooks/useAutoRefresh';

const DOCTOR_QUEUE_STATUSES = new Set(['PAID', 'VITALS_RECORDED', 'CONSULTATION_STARTED']);

export const useDoctorQueue = (columnFilters: Record<string, string> = {}) => {
  const router = useRouter();
  const { user, hospitalTimezone } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientDetails, setPatientDetails] = useState<Record<string, PatientResponse>>({});
  const [activeTab, setActiveTab] = useState<'TODAY' | 'UPCOMING'>('TODAY');
  const debouncedColumnFilters = useDebounce(columnFilters, 500);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!user || !hospitalTimezone) {
      setLoading(false);
      return;
    }

    try {
      if (!isBackground) setLoading(true);
      const { from, to } = getHospitalDayRangeUTC(hospitalTimezone);
      
      const fromParam = activeTab === 'TODAY' ? from : undefined;
      const toParam = activeTab === 'TODAY' ? to : undefined;

      const response = await appointmentService.list({ 
        page: 0, 
        size: 100, 
        from: fromParam, 
        to: toParam, 
        doctorId: user.id,
        ...debouncedColumnFilters
      });

      if (response.success && response.data) {
        // Filter by current doctor as a safety measure
        const doctorAppointments = response.data.content.filter((appointment) => {
          return appointment.doctorId === user.id || 
                 appointment.doctorName.toLowerCase().includes(user.fullName.toLowerCase());
        });

        setAppointments(doctorAppointments);
      }
    } catch (error) {
      console.error('Failed to fetch patient queue', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [user, hospitalTimezone, activeTab, debouncedColumnFilters]);

  // Fetch missing patient details
  useEffect(() => {
    const fetchMissingPatients = async () => {
      const patientIdsToFetch = [...new Set(appointments.map(a => a.patientId))]
        .filter(id => !patientDetails[id]);

      if (patientIdsToFetch.length > 0) {
        const details = await Promise.allSettled(
          patientIdsToFetch.map(id => patientService.get(id))
        );

        setPatientDetails(prev => {
          const newDetails = { ...prev };
          details.forEach(result => {
            if (result.status === 'fulfilled') {
              const res = result.value;
              if (res.success && res.data) {
                newDetails[res.data.id] = res.data;
              }
            }
          });
          return newDetails;
        });
      }
    };

    if (appointments.length > 0) {
      const trigger = async () => {
        await fetchMissingPatients();
      };
      void trigger();
    }
  }, [appointments, patientDetails]);

  useEffect(() => {
    const trigger = async () => {
      await fetchData();
    };
    void trigger();
  }, [fetchData]);

  useAutoRefresh(fetchData, DASHBOARD_REFRESH_INTERVAL, !!user);

  const stats = useMemo(() => {
    if (!hospitalTimezone) return { total: 0, waiting: 0, inProgress: 0, completed: 0 };

    const hospitalToday = dayjs().tz(hospitalTimezone).format('YYYY-MM-DD');
    const todayApps = appointments.filter(a => dayjs(a.appointmentTime).tz(hospitalTimezone).format('YYYY-MM-DD') === hospitalToday);

    const waiting = todayApps.filter((a) => a.status === 'PAID' || a.status === 'VITALS_RECORDED').length;
    const inProgress = todayApps.filter((a) => a.status === 'CONSULTATION_STARTED').length;
    const completed = todayApps.filter((a) => a.status === 'COMPLETED').length;

    return {
      total: todayApps.length,
      waiting,
      inProgress,
      completed,
    };
  }, [appointments, hospitalTimezone]);

  const handleStartConsultation = async (id: string) => {
    try {
      const appointment = appointments.find(a => a.id === id);
      
      if (!appointment) {
        triggerGlobalToast('Appointment not found', 'error');
        return;
      }

      if (appointment.status === 'CONSULTATION_STARTED') {
        router.push(`/doctor/active-consultation?appointmentId=${id}`);
        return;
      }

      const allowedStatuses = ['PAID', 'VITALS_RECORDED'];
      if (!allowedStatuses.includes(appointment.status)) {
        const messages: Record<string, string> = {
          'SCHEDULED': 'Consultation cannot be started as payment is pending/vitals not recorded',
          'PAYMENT_PENDING': 'Consultation cannot be started as payment is pending',
          'CANCELLED': 'This appointment has been cancelled',
          'PRESCRIPTION_FINALIZED': 'Prescription has already been finalized for this appointment',
          'COMPLETED': 'Consultation has already been completed for this appointment'
        };
        
        triggerGlobalToast(messages[appointment.status] || 'Consultation cannot be started at this time', 'warning');
        return;
      }

      if (!user?.id) {
        triggerGlobalToast('Doctor profile is unavailable', 'error');
        return;
      }

      const res = await appointmentService.startNextConsultation(user.id);
      if (res.success && res.data?.id) {
        router.push(`/doctor/active-consultation?appointmentId=${res.data.id}`);
      } else {
        triggerGlobalToast('Failed to start consultation', 'error');
      }
    } catch (error) {
      console.error('Failed to start consultation', error);
      triggerGlobalToast('Failed to start consultation', 'error');
    }
  };

  const filteredAppointments = useMemo(() => {
    if (!hospitalTimezone) return [];

    const hospitalToday = dayjs().tz(hospitalTimezone).format('YYYY-MM-DD');
    
    let base = appointments;
    base = activeTab === 'TODAY' ? appointments.filter(a => {
        const appHospitalDate = dayjs(a.appointmentTime).tz(hospitalTimezone).format('YYYY-MM-DD');
        return appHospitalDate === hospitalToday && DOCTOR_QUEUE_STATUSES.has(a.status);
      }) : appointments.filter(a => {
        const appHospitalDate = dayjs(a.appointmentTime).tz(hospitalTimezone).format('YYYY-MM-DD');
        return appHospitalDate > hospitalToday && DOCTOR_QUEUE_STATUSES.has(a.status);
      });
    
    const sorted = activeTab === 'TODAY' ? sortByToken(base) : [...base].toSorted((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
    
    if (!searchTerm) return sorted;
    const term = searchTerm.toLowerCase();
    return sorted.filter(
      (a) =>
        a.patientName.toLowerCase().includes(term) ||
        a.patientId.toLowerCase().includes(term)
    );
  }, [appointments, searchTerm, activeTab, hospitalTimezone]);

  return {
    appointments: filteredAppointments,
    loading,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    stats,
    patientDetails,
    handleStartConsultation,
    refresh: fetchData
  };
};
