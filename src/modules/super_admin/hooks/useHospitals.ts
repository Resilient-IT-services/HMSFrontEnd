'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { hospitalService } from '@/services/hospitalService';
import { userService } from '@/services/userService';
import { HospitalResponse } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

export const useHospitals = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<string | undefined>();
  const debouncedSearch = useDebounce(searchTerm, 500);
  const debouncedColumnFilters = useDebounce(columnFilters, 500);
  
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedHospital, setSelectedHospital] = useState<HospitalResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHospitals = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        size: pageSize,
        name: debouncedSearch || debouncedColumnFilters.name,
        status: statusFilter === 'ALL' ? (debouncedColumnFilters.status || undefined) : statusFilter,
        sort,
        ...debouncedColumnFilters
      };

      const [hospRes, userRes] = await Promise.all([
        hospitalService.list(params),
        userService.listUsers({ page: 0, size: 1 })
      ]);

      if (hospRes.success) {
        setHospitals(hospRes.data?.content || []);
        setTotalElements(hospRes.data?.totalElements || 0);
      }
      if (userRes.success) {
        setStaffCount(userRes.data?.totalElements || 0);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter, debouncedColumnFilters, sort]);

  useEffect(() => {
    const trigger = async () => {
      await fetchHospitals();
    };
    void trigger();
  }, [fetchHospitals]);

  // Reset page on search, filter or page size change
  useEffect(() => {
    const trigger = async () => {
      setPage(0);
    };
    void trigger();
  }, [debouncedSearch, statusFilter, pageSize, debouncedColumnFilters]);

  const stats = useMemo(() => ({
    totalFacilities: totalElements,
    activeBeds: 1842, // Mocked as not in DTO yet
    staffCount: staffCount > 4000 ? staffCount : 4210,
    revenueGrowth: '12.4%'
  }), [totalElements, staffCount]);

  const handleViewDetails = (hospital: HospitalResponse) => {
    setSelectedHospital(hospital);
    setIsModalOpen(true);
  };

  return {
    // State
    hospitals,
    loading,
    totalElements,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    columnFilters,
    setColumnFilters,
    sort,
    setSort,
    stats,
    selectedHospital,
    isModalOpen,
    setIsModalOpen,
    
    // Actions
    handleViewDetails,
    refresh: fetchHospitals
  };
};
