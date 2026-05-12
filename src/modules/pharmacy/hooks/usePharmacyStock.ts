'use client';

import { useState, useEffect, useCallback } from 'react';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { PharmacyStockDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';

export const usePharmacyStock = () => {
  const [medicines, setMedicines] = useState<PharmacyStockDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedMedicineForStock, setSelectedMedicineForStock] = useState<{ id: string; name: string } | null>(null);
  const [selectedMedicineForView, setSelectedMedicineForView] = useState<{ id: string; name: string } | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getMedicineStock({ 
        size: 20, 
        page, 
        search: debouncedSearch,
        lowStock: statusFilter === 'LOW_STOCK'
      });
      if (response.success && response.data) {
        setMedicines(response.data.content || []);
        setTotalElements(response.data.totalElements);
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
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

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
      totalStockUnits,
      lowStockCount,
      expiringSoonCount
    }
  };
};
