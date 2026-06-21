import { useState, useCallback } from 'react';
import { ipdService } from '@/services/ipdService';
import { AdmissionResponseDTO, BedTransferResponse } from '@/types/ipd';

export const useAdmissionDetails = (id: string) => {
  const [admission, setAdmission] = useState<AdmissionResponseDTO | null>(null);
  const [transfers, setTransfers] = useState<BedTransferResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ipdService.getAdmission(id);
      if (res.success && res.data) {
        setAdmission(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch admission details', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTransfers = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ipdService.getBedTransfers(id);
      if (res.success && res.data) {
        setTransfers(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch transfers', error);
    }
  }, [id]);

  return {
    admission,
    transfers,
    loading,
    fetchDetails,
    fetchTransfers
  };
};
