'use client';

import { useState, useEffect, useCallback } from 'react';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { PharmacyStockDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { DEFAULT_PAGE_SIZE, DEFAULT_DEBOUNCE_MS } from '@/utils/constants';

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
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        if (statusFilter === 'EXPIRED') {
          content = content.filter(m => m.expiryDate && new Date(m.expiryDate) < today);
        } else if (statusFilter === 'EXPIRING_SOON') {
          content = content.filter(m => {
            if (!m.expiryDate) return false;
            const expDate = new Date(m.expiryDate);
            return expDate >= today && expDate < thirtyDaysFromNow;
          });
        } else if (statusFilter === 'LOW_STOCK') {
          // Backend might already handle this, but ensuring consistency
          content = content.filter(m => (m.quantity || 0) < 50);
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

  const handleExport = () => {
    if (medicines.length === 0) {
        triggerGlobalToast('No data available to export', 'error');
        return;
    }
    
    const headers = ['Medicine Name', 'Batch', 'Expiry Date', 'Quantity', 'Price (₹)'];
    const csvContent = [
      headers.join(','),
      ...medicines.map(m => [
        `"${m.medicineName}"`,
        `"${m.batchNumber}"`,
        `"${m.expiryDate}"`,
        m.quantity,
        m.price
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleImport = async (file: File) => {
    try {
      setImporting(true);
      const response = await pharmacyApi.importStock(file);
      if (response.success) {
        triggerGlobalToast('Stock imported successfully', 'success');
        fetchInventory();
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
  const lowStockCount = medicines.filter(m => (m.quantity || 0) > 0 && (m.quantity || 0) < 50).length;
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expDate = new Date(m.expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expDate < thirtyDaysFromNow;
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
