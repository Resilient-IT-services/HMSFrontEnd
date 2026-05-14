'use client';

import { useState, useEffect, useCallback } from 'react';
import { patientService } from '@/services/patientService';
import { PatientSummaryDTO } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';
import { DEFAULT_DEBOUNCE_MS, DEFAULT_PAGE_SIZE } from '@/utils/constants';

export const useReceptionPatients = () => {
  const [patients, setPatients] = useState<PatientSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, DEFAULT_DEBOUNCE_MS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientService.listSummary(page, pageSize, debouncedSearchTerm);
      if (response.success && response.data) {
        setPatients(response.data.content);
        setTotalElements(response.data.totalElements);
      }
    } catch (error) {
      console.error('Failed to fetch patients', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Reset page when search term or page size changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchTerm, pageSize]);

  return {
    patients,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    refresh: fetchPatients
  };
};
