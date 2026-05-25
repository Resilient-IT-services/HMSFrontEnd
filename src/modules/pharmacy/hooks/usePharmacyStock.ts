'use client';

import { useState, useEffect, useCallback } from 'react';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { PharmacyStockDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { DEFAULT_PAGE_SIZE, DEFAULT_DEBOUNCE_MS } from '@/utils/constants';
import dayjs from '@/lib/dayjs';

export const usePharmacyStock = () => {
  const [medicines, setMedicines] = useState<PharmacyStockDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const debouncedSearch = useDebounce(searchTerm, DEFAULT_DEBOUNCE_MS);
  const [selectedMedicineForStock, setSelectedMedicineForStock] = useState<{ id: string; name: string } | null>(null);
  const [selectedMedicineForView, setSelectedMedicineForView] = useState<{ id: string; name: string } | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getMedicineStock({ 
        size: pageSize, 
        page, 
        search: debouncedSearch,
        lowStock: statusFilter === 'LOW_STOCK',
        expired: statusFilter === 'EXPIRED',
        expiringSoon: statusFilter === 'EXPIRING_SOON'
      });
      if (response.success && response.data) {
        let content = response.data.content || [];

        // Client-side filtering fallback for filters not supported by backend
        const today = dayjs().startOf('day');
        const thirtyDaysFromNow = dayjs().add(30, 'day').endOf('day');

        switch (statusFilter) {
        case 'EXPIRED': {
          content = content.filter(m => m.expiryDate && dayjs(m.expiryDate).isBefore(today));
        
        break;
        }
        case 'EXPIRING_SOON': {
          content = content.filter(m => {
            if (!m.expiryDate) return false;
            const expDate = dayjs(m.expiryDate);
            return expDate.isAfter(today.subtract(1, 'day')) && expDate.isBefore(thirtyDaysFromNow);
          });
        
        break;
        }
        case 'LOW_STOCK': {
          // Backend might already handle this, but ensuring consistency
          content = content.filter(m => {
            const qty = Number(m.quantity || 0);
            const threshold = Number(m.reorderLevel || 50); // Fallback to 50 if 0, null, or undefined
            return qty < threshold && qty > 0;
          });
        
        break;
        }
        // No default
        }

        // Client-side search fallback
        if (debouncedSearch) {
          const searchLower = debouncedSearch.toLowerCase();
          content = content.filter(m => 
            m.medicineName.toLowerCase().includes(searchLower) || 
            (m.batchNumber?.toLowerCase().includes(searchLower))
          );
        }

        setMedicines(content);
        setTotalElements(statusFilter === 'ALL' && !debouncedSearch ? response.data.totalElements : content.length);
      } else {
        setMedicines([]);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Fetch Inventory Error:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    const trigger = async () => {
      await fetchInventory();
    };
    void trigger();
  }, [fetchInventory]);

  useEffect(() => {
    const trigger = async () => {
      setPage(0);
    };
    void trigger();
  }, [debouncedSearch, statusFilter, pageSize]);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.exportStockExcel();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pharmacy_stock_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.append(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
      triggerGlobalToast('Failed to export stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setImporting(true);
      const response = await pharmacyApi.importStock(file);
      if (response.success && response.data) {
        const { importedRows, medicineNotFoundRows, skippedRows, errorFileBase64 } = response.data;
        
        if (medicineNotFoundRows > 0 || skippedRows > 0) {
          triggerGlobalToast(
            `Import partial: ${importedRows} success, ${medicineNotFoundRows} medicine not found, ${skippedRows} failed. Downloading feedback file...`, 
            'warning'
          );
          
          if (errorFileBase64) {
            const byteCharacters = atob(errorFileBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `stock_import_feedback_${new Date().getTime()}.xlsx`);
            document.body.append(link);
            link.click();
            link.remove();
          }
        } else {
          triggerGlobalToast(`Successfully imported ${importedRows} records`, 'success');
        }
        fetchInventory();
      } else {
        triggerGlobalToast(response.message || 'Import failed', 'error');
      }
    } catch (error) {
      console.error('Import failed', error);
      triggerGlobalToast('Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!globalThis.confirm(`Are you sure you want to delete "${name}"? This will remove all stock records for this specific batch.`)) return;

    try {
      setLoading(true);
      const response = await pharmacyApi.deleteMedicine(id); 
      if (response.success) {
        setMedicines(prev => prev.filter(m => m.id !== id));
        triggerGlobalToast('Record deleted', 'success');
      }
    } catch (error) {
      console.error('Delete failed', error);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const uniqueMedicinesCount = new Set(medicines.map(m => m.medicineId)).size;
  const totalStockUnits = medicines.reduce((acc, m) => acc + (m.quantity || 0), 0);
  const lowStockCount = medicines.filter(m => {
    const qty = Number(m.quantity || 0);
    const threshold = Number(m.reorderLevel || 50);
    return qty > 0 && qty < threshold;
  }).length;
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expDate = dayjs(m.expiryDate);
    const thirtyDaysFromNow = dayjs().add(30, 'day');
    return expDate.isBefore(thirtyDaysFromNow);
  }).length;

  return {
    medicines,
    loading,
    importing,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    selectedMedicineForStock,
    setSelectedMedicineForStock,
    selectedMedicineForView,
    setSelectedMedicineForView,
    handleExport,
    handleImport,
    handleDelete,
    refresh: fetchInventory,
    stats: {
      totalElements,
      uniqueMedicinesCount,
      totalStockUnits,
      lowStockCount,
      expiringSoonCount
    }
  };
};
