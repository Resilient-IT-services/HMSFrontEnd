'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { useDebounce } from '@/hooks/useDebounce';
import { PatientResponse, AppointmentResponse, PrescriptionResponse, AppointmentSummaryDTO, PatientSummaryDTO } from '@/types/api';

export const useMedicalHistory = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');
  
  const [patients, setPatients] = useState<PatientSummaryDTO[]>([]);
  const [historyAppointments, setHistoryAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [patientVisits, setPatientVisits] = useState<AppointmentResponse[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<AppointmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [activeView, setActiveView] = useState<'APPOINTMENTS' | 'PATIENTS'>('APPOINTMENTS');

  // Pagination State
  const [appointmentsPage, setAppointmentsPage] = useState(0);
  const [appointmentsTotalElements, setAppointmentsTotalElements] = useState(0);
  const [patientsPage, setPatientsPage] = useState(0);
  const [patientsTotalElements, setPatientsTotalElements] = useState(0);
  const pageSize = 10;

  const fetchHistoryList = useCallback(async (search = '', page = 0) => {
    try {
      setLoading(true);
      const res = await appointmentService.listSummary(page, pageSize, search, undefined, undefined, 'COMPLETED');
      if (res.success && res.data) {
        setHistoryAppointments(res.data.content);
        setAppointmentsTotalElements(res.data.totalElements);
        setAppointmentsPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientsList = useCallback(async (search = '', page = 0) => {
    try {
      setLoading(true);
      const res = await patientService.listSummary(page, pageSize, search);
      if (res.success && res.data) {
        setPatients(res.data.content);
        setPatientsTotalElements(res.data.totalElements);
        setPatientsPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch patients', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientDetails = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await patientService.getHistorySummary(id);

      if (res.success && res.data) {
        setSelectedPatient(res.data.patient as any);
        const sortedVisits = (res.data.visits || []).toSorted(
          (a, b) => new Date(b.appointmentTime).getTime() - new Date(a.appointmentTime).getTime()
        );
        setPatientVisits(sortedVisits as any);
        
        if (sortedVisits.length > 0) {
          const detailRes = await appointmentService.get(sortedVisits[0].id);
          if (detailRes.success && detailRes.data) {
            setSelectedVisit(detailRes.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch patient details', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (activeView === 'APPOINTMENTS') {
      fetchHistoryList(debouncedSearchTerm, appointmentsPage);
    } else {
      fetchPatientsList(debouncedSearchTerm, patientsPage);
    }
  }, [activeView, appointmentsPage, patientsPage, debouncedSearchTerm, fetchHistoryList, fetchPatientsList]);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails(patientId);
    } else {
      setSelectedPatient(null);
      setSelectedVisit(null);
      setPatientVisits([]);
    }
  }, [patientId, fetchPatientDetails]);

  // Reset page when search term changes
  useEffect(() => {
    setAppointmentsPage(0);
    setPatientsPage(0);
  }, [debouncedSearchTerm]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Pagination is already reset by the useEffect above
    // debouncedSearchTerm will trigger the fetch
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
    patients,
    historyAppointments,
    selectedPatient,
    patientVisits,
    selectedVisit,
    loading,
    searchTerm,
    setSearchTerm,
    activeView,
    setActiveView,
    appointmentsPage,
    setAppointmentsPage,
    appointmentsTotalElements,
    patientsPage,
    setPatientsPage,
    patientsTotalElements,
    handleSearch,
    selectPatient,
    handleSelectVisit,
    clearSelection
  };
};
