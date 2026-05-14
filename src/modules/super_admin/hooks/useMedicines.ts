'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { pharmacyService } from '@/services/pharmacyService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { MedicineResponse } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

export const useMedicines = () => {
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.listMedicines({ search: debouncedSearch, size: 2000 });
      if (response.success && response.data) {
        setMedicines(response.data.content);
        setTotalMedicines(response.data.totalElements);
        if (response.data.content.length > 0 && !selectedMedicine) {
          setSelectedMedicine(response.data.content[0]);
        }
      }
    } catch (error) {
      console.error('Fetch failed', error);
      triggerGlobalToast('Failed to load medicines', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedMedicine]);

  useEffect(() => {
    const trigger = async () => {
      await fetchMedicines();
    };
    void trigger();
  }, [fetchMedicines]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      triggerGlobalToast('Please select an Excel file', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await pharmacyService.importMaster(file);
      if (response.success) {
        triggerGlobalToast(`Import completed. The system is designed to skip medicines that already exist by Name and Composition.`, 'success');
        setFile(null);
        setShowImportModal(false);
        fetchMedicines();
      }
    } catch (error) {
      console.error('Import failed', error);
      triggerGlobalToast('Failed to import medicines', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicine = async (id: string, name: string) => {
    if (!globalThis.confirm(`Are you sure you want to delete "${name}" from the master catalog?`)) return;
    
    try {
      setLoading(true);
      const response = await pharmacyService.deleteMedicine(id);
      if (response.success) {
        triggerGlobalToast('Medicine deleted successfully', 'success');
        if (selectedMedicine?.id === id) setSelectedMedicine(null);
        fetchMedicines();
      }
    } catch (error) {
      console.error('Delete failed', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    medicines,
    totalMedicines,
    loading,
    searchTerm,
    setSearchTerm,
    showImportModal,
    setShowImportModal,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    selectedMedicine,
    setSelectedMedicine,
    file,
    setFile,
    
    // Actions
    handleFileChange,
    handleUpload,
    handleDeleteMedicine,
    refresh: fetchMedicines
  };
};
