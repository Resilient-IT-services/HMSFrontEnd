'use client';

import { useState, useEffect, useCallback } from 'react';
import { patientService } from '@/services/patientService';
import { PatientSummaryDTO } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

export const useReceptionPatients = () => {
  const [patients, setPatients] = useState<PatientSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientService.listSummary(page, 20, debouncedSearchTerm);
      if (response.success && response.data) {
        setPatients(response.data.content);
        setTotalElements(response.data.totalElements);
      }
    } catch (error) {
      console.error('Failed to fetch patients', error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchTerm]);

  return {
    patients,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalElements,
    refresh: fetchPatients
  };
};
