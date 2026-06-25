import { useState, useCallback } from 'react';
import { ipdService } from '@/services/ipdService';
import { AdmissionResponseDTO, BedTransferResponse, ProgressNoteResponseDTO } from '@/types/ipd';

export const useAdmissionDetails = (id: string) => {
  const [admission, setAdmission] = useState<AdmissionResponseDTO | null>(null);
  const [transfers, setTransfers] = useState<BedTransferResponse[]>([]);
  const [progressNotes, setProgressNotes] = useState<ProgressNoteResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);

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

  const fetchProgressNotes = useCallback(async () => {
    if (!id) return;
    setNotesLoading(true);
    try {
      const res = await ipdService.getProgressNotes(id);
      if (res.success && res.data) {
        setProgressNotes(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch progress notes', error);
    } finally {
      setNotesLoading(false);
    }
  }, [id]);

  const addProgressNote = async (note: string) => {
    if (!id) return null;
    try {
      const res = await ipdService.createProgressNote(id, { note });
      if (res.success && res.data) {
        await fetchProgressNotes();
        return res.data;
      }
    } catch (error) {
      console.error('Failed to create progress note', error);
      throw error;
    }
    return null;
  };

  return {
    admission,
    transfers,
    progressNotes,
    loading,
    notesLoading,
    fetchDetails,
    fetchTransfers,
    fetchProgressNotes,
    addProgressNote
  };
};
