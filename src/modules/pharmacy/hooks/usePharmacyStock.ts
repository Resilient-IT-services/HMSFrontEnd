'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { PharmacyStockDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { DEFAULT_PAGE_SIZE, DEFAULT_DEBOUNCE_MS } from '@/utils/constants';

export const usePharmacyStock = () => {
  const searchParams = useSearchParams();
  const [medicines, setMedicines] = useState<PharmacyStockDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Sync status filter with URL search params during render
  const urlStatus = searchParams.get('status');
  if (urlStatus && urlStatus !== statusFilter) {
    setStatusFilter(urlStatus);
  }

  // Reset page when filters change during render
  const [prevFilters, setPrevFilters] = useState({ searchTerm, statusFilter, pageSize });
  if (prevFilters.searchTerm !== searchTerm || 
      prevFilters.statusFilter !== statusFilter || 
      prevFilters.pageSize !== pageSize) {
    setPage(0);
    setPrevFilters({ searchTerm, statusFilter, pageSize });
  }

  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalMedicines: 0,
    lowStockCount: 0,
    expiringSoonCount: 0
  });
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<string | undefined>();
  const debouncedSearch = useDebounce(searchTerm, DEFAULT_DEBOUNCE_MS);
  const debouncedColumnFilters = useDebounce(columnFilters, DEFAULT_DEBOUNCE_MS);
  const [selectedMedicineForStock, setSelectedMedicineForStock] = useState<{ id: string; name: string; taxPercentage?: number; hsnCode?: string } | null>(null);
  const [selectedMedicineForView, setSelectedMedicineForView] = useState<{ id: string; name: string } | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const [inventoryRes, statsRes] = await Promise.all([
        pharmacyApi.getMedicineStock({ 
          size: pageSize, 
          page, 
          search: debouncedSearch,
          lowStock: statusFilter === 'LOW_STOCK',
          expired: statusFilter === 'EXPIRED',
          expiringSoon: statusFilter === 'EXPIRING_SOON',
          sort,
          ...debouncedColumnFilters
        }),
        pharmacyApi.getDashboardStats()
      ]);

      if (inventoryRes.success && inventoryRes.data) {
        setMedicines(inventoryRes.data.content || []);
        setTotalElements(inventoryRes.data.totalElements);
      } else {
        setMedicines([]);
        setTotalElements(0);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Fetch Inventory/Stats Error:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter, debouncedColumnFilters, sort]);

  useEffect(() => {
    const trigger = async () => {
      await fetchInventory();
    };
    void trigger();
  }, [fetchInventory]);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.exportStockExcel();
      const url = globalThis.URL.createObjectURL(new Blob([response]));
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

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.downloadStockTemplate();
      const url = globalThis.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'stock_import_template.xlsx');
      document.body.append(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download template failed', error);
      triggerGlobalToast('Failed to download template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setImporting(true);
      const response = await pharmacyApi.importStock(file);
      if (response.success && response.data) {
        const { importedRows, medicineNotFoundRows, skippedRows, failedRows, errorFileBase64 } = response.data;
        
        if (medicineNotFoundRows > 0 || skippedRows > 0 || (failedRows || 0) > 0) {
          const totalIssues = (medicineNotFoundRows || 0) + (skippedRows || 0) + (failedRows || 0);
          triggerGlobalToast(
            `Import partial: ${importedRows} success, ${totalIssues} issues found. Downloading feedback file...`, 
            'warning'
          );
          
          if (errorFileBase64) {
            const byteCharacters = atob(errorFileBase64);
            const byteNumbers = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.codePointAt(i)!;
            }
            const blob = new Blob([byteNumbers], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `stock_import_feedback_${Date.now()}.xlsx`);
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
      const response = await pharmacyApi.deleteStock(id); 
      if (response.success) {
        setMedicines(prev => prev.filter(m => m.id !== id));
        triggerGlobalToast('Stock record deleted', 'success');
      }
    } catch (error: any) {
      console.error('Delete failed', error);
      
      if (error.response?.status === 409) {
        if (globalThis.confirm('This batch has sales history and cannot be deleted for audit reasons. Would you like to set its quantity to 0 instead?')) {
          await handleAdjust(id, 0);
        }
      } else {
        const message = error.response?.data?.error?.message || 'Failed to delete stock record';
        triggerGlobalToast(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (id: string, quantity: number) => {
    try {
      setLoading(true);
      const response = await pharmacyApi.adjustStock(id, quantity);
      if (response.success) {
        setMedicines(prev => prev.map(m => m.id === id ? { ...m, quantity } : m));
        triggerGlobalToast(`Stock quantity updated to ${quantity}`, 'success');
      }
    } catch (error) {
      console.error('Adjustment failed', error);
      triggerGlobalToast('Failed to adjust stock quantity', 'error');
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const totalStockUnits = medicines.reduce((acc, m) => acc + (m.quantity || 0), 0);

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
    columnFilters,
    setColumnFilters,
    sort,
    setSort,
    selectedMedicineForStock,
    setSelectedMedicineForStock,
    selectedMedicineForView,
    setSelectedMedicineForView,
    handleExport,
    handleDownloadTemplate,
    handleImport,
    handleDelete,
    handleAdjust,
    refresh: fetchInventory,
    stats: {
      totalElements, // Keep this as paginated/filtered total batches
      uniqueMedicinesCount: stats.totalMedicines,
      totalStockUnits,
      lowStockCount: stats.lowStockCount,
      expiringSoonCount: stats.expiringSoonCount
    }
  };
};
