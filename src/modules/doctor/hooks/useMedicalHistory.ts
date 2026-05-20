'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { RootState } from '@/state/store';
import { useDebounce } from '@/hooks/useDebounce';
import { PatientResponse, AppointmentResponse, AppointmentSummaryDTO } from '@/types/api';
import { DEFAULT_PAGE_SIZE, DEFAULT_DEBOUNCE_MS } from '@/utils/constants';
import dayjs from '@/lib/dayjs';

export const useMedicalHistory = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [historyAppointments, setHistoryAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [patientDetails, setPatientDetails] = useState<Record<string, PatientResponse>>({});
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [patientVisits, setPatientVisits] = useState<AppointmentResponse[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<AppointmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, DEFAULT_DEBOUNCE_MS);

  // Pagination State
  const [appointmentsPage, setAppointmentsPage] = useState(0);
  const [appointmentsTotalElements, setAppointmentsTotalElements] = useState(0);
  const pageSize = DEFAULT_PAGE_SIZE;

  const fetchHistoryList = useCallback(async (search = '', page = 0) => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Determine if search term looks like a patient code (e.g. PAT-001, 26-005) or is numeric
      const trimmed = search.trim();
      const looksLikeCode = /^[\w\d]+-[\w\d]+$/.test(trimmed) || /^\d+$/.test(trimmed);
      
      // Remove doctorId filter to allow searching all doctors/patients as requested
      // We pass the term to both search and specific fields if the backend supports them
      const res = await appointmentService.listSummary({ 
        page, 
        size: pageSize, 
        search: looksLikeCode ? undefined : trimmed,
        patientCode: looksLikeCode ? trimmed : undefined,
        status: 'COMPLETED' 
      });
      if (res.success && res.data) {
        setHistoryAppointments(res.data.content);
        setAppointmentsTotalElements(res.data.totalElements);
        setAppointmentsPage(page);

        // Fetch patient details for gender/age (similar to OP Patient Queue)
        const pIds = [...new Set(res.data.content.map(a => a.patientId))];
        for (const pid of pIds) {
          if (!patientDetails[pid]) {
            patientService.get(pid).then(pRes => {
              if (pRes.success && pRes.data) {
                setPatientDetails(prev => ({ ...prev, [pid]: pRes.data! }));
              }
            }).catch(error => console.error('Failed to fetch patient detail', error));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  }, [user, pageSize, patientDetails]);

  const fetchPatientDetails = useCallback(async (id: string) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await patientService.getHistorySummary(id);

      if (res.success && res.data) {
        setSelectedPatient(res.data.patient as any);
        
        // When looking at detailed history, we show all visits but sort them
        const allVisits = res.data.visits || [];
        const sortedVisits = allVisits.toSorted(
          (a, b) => dayjs(b.appointmentTime).valueOf() - dayjs(a.appointmentTime).valueOf()
        );
        setPatientVisits(sortedVisits as any);
        
        if (sortedVisits.length > 0) {
          const detailRes = await appointmentService.get(sortedVisits[0].id);
          if (detailRes.success && detailRes.data) {
            setSelectedVisit(detailRes.data);
          }
        } else {
          setSelectedVisit(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch patient details', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSelectVisit = async (visit: any) => {
    if (selectedVisit?.id === visit.id) return;
    try {
      setLoading(true);
      const res = await appointmentService.get(visit.id);
      if (res.success && res.data) {
        setSelectedVisit(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointment details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trigger = async () => {
      await fetchHistoryList(debouncedSearchTerm, appointmentsPage);
    };
    void trigger();
  }, [appointmentsPage, debouncedSearchTerm, fetchHistoryList]);

  useEffect(() => {
    const trigger = async () => {
      if (patientId) {
        await fetchPatientDetails(patientId);
      } else {
        setSelectedPatient(null);
        setSelectedVisit(null);
        setPatientVisits([]);
      }
    };
    void trigger();
  }, [patientId, fetchPatientDetails]);

  // Reset page when search term changes
  useEffect(() => {
    const trigger = async () => {
      setAppointmentsPage(0);
    };
    void trigger();
  }, [debouncedSearchTerm]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
  };

  const selectPatient = (id: string) => {
    router.push(`/doctor/history?patientId=${id}`);
  };

  const clearSelection = () => {
    router.push('/doctor/history');
    setSelectedPatient(null);
    setPatientVisits([]);
    setSelectedVisit(null);
  };

  return {
    patientId,
    historyAppointments,
    patientDetails,
    selectedPatient,
    patientVisits,
    selectedVisit,
    loading,
    searchTerm,
    setSearchTerm,
    appointmentsPage,
    setAppointmentsPage,
    appointmentsTotalElements,
    pageSize,
    setPageSize: () => {}, // Placeholder as pageSize is currently fixed
    handleSearch,
    selectPatient,
    handleSelectVisit,
    clearSelection
  };
};
