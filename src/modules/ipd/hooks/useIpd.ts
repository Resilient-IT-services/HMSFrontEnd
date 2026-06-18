import { useState, useCallback } from 'react';
import { ipdService } from '@/services/ipdService';
import { AdmissionResponseDTO, WardDTO, AdmissionStatus } from '@/types/ipd';
import { PageResponse } from '@/types/api';

export const useIpd = () => {
  const [admissions, setAdmissions] = useState<PageResponse<AdmissionResponseDTO> | null>(null);
  const [wards, setWards] = useState<PageResponse<WardDTO> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmissions = useCallback(async (page = 0, size = 20) => {
    setLoading(true);
    try {
      const response = await ipdService.listAdmissions({ page, size });
      if (response.success && response.data) {
        setAdmissions(response.data);
      } else {
        setError(response.message || 'Failed to fetch admissions');
      }
    } catch (error_: any) {
      setError(error_.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWards = useCallback(async (page = 0, size = 20) => {
    setLoading(true);
    try {
      const response = await ipdService.listWards({ page, size });
      if (response.success && response.data) {
        setWards(response.data);
      } else {
        setError(response.message || 'Failed to fetch wards');
      }
    } catch (error_: any) {
      setError(error_.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, status: AdmissionStatus) => {
    try {
      const response = await ipdService.updateAdmissionStatus(id, status);
      if (response.success) {
        fetchAdmissions();
        return true;
      }
    } catch (error_) {
      console.error('Failed to update status', error_);
    }
    return false;
  };

  return {
    admissions,
    wards,
    loading,
    error,
    fetchAdmissions,
    fetchWards,
    updateStatus
  };
};
