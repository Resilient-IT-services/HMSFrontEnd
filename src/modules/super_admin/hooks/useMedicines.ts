'use client';

import { useState, useEffect, useCallback } from 'react';
import { pharmacyService } from '@/services/pharmacyService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { MedicineResponse } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

export const useMedicines = (initialType?: 'MEDICINE' | 'CONSUMABLE') => {
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showInventoryImportModal, setShowInventoryImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.listMedicines({ 
        search: debouncedSearch, 
        page,
        size: pageSize,
        category: categoryFilter || undefined,
        // Pass itemType if provided to the hook
        ...(initialType ? { itemType: initialType } : {})
      } as any);
      
      if (response.success && response.data) {
        setMedicines(response.data.content);
        setTotalMedicines(response.data.totalElements);
      }
    } catch (error) {
      console.error('Fetch failed', error);
      triggerGlobalToast('Failed to load catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, categoryFilter, initialType]);

  useEffect(() => {
    const trigger = async () => {
      await fetchMedicines();
    };
    void trigger();
  }, [fetchMedicines]);

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(category);
    setPage(0);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadErrorFile = (base64: string, filename: string) => {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = Array.from({ length: byteCharacters.length }, (_, i) => byteCharacters.codePointAt(i)!);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${Date.now()}.xlsx`;
      document.body.append(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading file', error);
      triggerGlobalToast('Failed to download error report', 'error');
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
      if (response.success && response.data) {
        const { failedRows, errorFileBase64 } = response.data as any;
        
        if (failedRows > 0) {
          triggerGlobalToast(`Import completed with ${failedRows} errors.`, 'warning');
          if (errorFileBase64) {
            downloadErrorFile(errorFileBase64, 'Medicine_Import_Error');
          }
        } else {
          triggerGlobalToast('All medicines imported successfully.', 'success');
        }
        
        setFile(null);
        setShowImportModal(false);
        void fetchMedicines();
      }
    } catch (error) {
      console.error('Import failed', error);
      triggerGlobalToast('Failed to import medicines', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryUpload = async () => {
    if (!file) {
      triggerGlobalToast('Please select an Excel file', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await pharmacyService.importInventoryItems(file);
      if (res.failureCount === 0) {
        triggerGlobalToast('All records imported successfully.', 'success');
      } else {
        triggerGlobalToast(`Import completed with ${res.failureCount} errors.`, 'warning');
        if (res.errorFileAvailable && res.errorFileBase64) {
          downloadErrorFile(res.errorFileBase64, 'Inventory_Import_Error');
        }
      }
      setFile(null);
      setShowInventoryImportModal(false);
      void fetchMedicines();
    } catch (error: any) {
      console.error('Import failed', error);
      triggerGlobalToast(error?.response?.data?.message || 'Failed to import inventory', 'error');
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
        void fetchMedicines();
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
    setSearchTerm: handleSearchTermChange,
    categoryFilter,
    setCategoryFilter: handleCategoryFilterChange,
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    showImportModal,
    setShowImportModal,
    showInventoryImportModal,
    setShowInventoryImportModal,
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
    handleInventoryUpload,
    handleDeleteMedicine,
    refresh: fetchMedicines
  };
};
