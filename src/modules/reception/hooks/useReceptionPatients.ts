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
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<string | undefined>();
  const debouncedColumnFilters = useDebounce(columnFilters, DEFAULT_DEBOUNCE_MS);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientService.listSummary({ 
        page, 
        size: pageSize, 
        search: debouncedSearchTerm,
        sort,
        ...debouncedColumnFilters
      });
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
    const trigger = async () => {
      await fetchPatients();
    };
    void trigger();
  }, [fetchPatients]);

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  return {
    patients,
    loading,
    searchTerm,
    setSearchTerm: handleSearchTermChange,
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalElements,
    columnFilters,
    setColumnFilters,
    sort,
    setSort,
    refresh: fetchPatients
  };
};
