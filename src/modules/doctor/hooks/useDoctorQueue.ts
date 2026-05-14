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

import { useAutoRefresh } from '@/hooks/useAutoRefresh';

export const useDoctorQueue = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientDetails, setPatientDetails] = useState<Record<string, PatientResponse>>({});
  const [activeTab, setActiveTab] = useState<'TODAY' | 'UPCOMING'>('TODAY');

  const fetchData = useCallback(async (isBackground = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (!isBackground) setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await appointmentService.list(0, 100, undefined, today, user.id);

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
  }, [user?.id, user?.fullName]);

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
      fetchMissingPatients();
    }
  }, [appointments, patientDetails]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useAutoRefresh(fetchData, DASHBOARD_REFRESH_INTERVAL, !!user);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayApps = appointments.filter(a => a.appointmentTime.startsWith(today));

    const waiting = todayApps.filter((a) => a.status === 'SCHEDULED').length;
    const inProgress = todayApps.filter((a) => a.status === 'WALK_IN').length;
    const completed = todayApps.filter((a) => a.status === 'COMPLETED').length;

    return {
      total: todayApps.length,
      waiting,
      inProgress,
      completed,
    };
  }, [appointments]);

  const handleStartConsultation = async (id: string) => {
    try {
      const res = await appointmentService.updateStatus(id, { status: 'WALK_IN' });
      if (res.success) {
        router.push(`/doctor/active-consultation?appointmentId=${id}`);
      } else {
        triggerGlobalToast('Failed to start consultation', 'error');
      }
    } catch (error) {
      console.error('Failed to start consultation', error);
      triggerGlobalToast('Failed to start consultation', 'error');
    }
  };

  const filteredAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    let base = appointments;
    base = activeTab === 'TODAY' ? appointments.filter(a => 
        a.appointmentTime.startsWith(today) && 
        (a.status === 'SCHEDULED' || a.status === 'WALK_IN')
      ) : appointments.filter(a => a.appointmentTime > today && a.status !== 'CANCELLED');
    
    const sorted = activeTab === 'TODAY' ? sortByToken(base) : [...base].toSorted((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
    
    if (!searchTerm) return sorted;
    const term = searchTerm.toLowerCase();
    return sorted.filter(
      (a) =>
        a.patientName.toLowerCase().includes(term) ||
        a.patientId.toLowerCase().includes(term)
    );
  }, [appointments, searchTerm, activeTab]);

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
