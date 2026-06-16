'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import QuickStockAddModal from '@/modules/pharmacy/components/QuickStockAddModal';
import MedicineViewModal from '@/modules/pharmacy/components/MedicineViewModal';
import { PharmacyStockDTO } from '@/types/api';
import { usePharmacyStock } from '@/modules/pharmacy/hooks/usePharmacyStock';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { MetricsGrid } from '@/components/ui/MetricsGrid';
import { PageSurface } from '@/components/ui/PageSurface';

export const StockManagement = () => {
  const {
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
    selectedMedicineForStock,
    setSelectedMedicineForStock,
    selectedMedicineForView,
    setSelectedMedicineForView,
    handleExport,
    handleDownloadTemplate,
    handleImport,
    refresh,
    stats
  } = usePharmacyStock();

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx, .xls';
    input.addEventListener('change', async (event: Event) => {
      const inputElement = event.target as HTMLInputElement;
      const file = inputElement.files?.[0];
      if (file) {
        await handleImport(file);
      }
    });
    input.click();
  };

  const columns: Column<PharmacyStockDTO>[] = [
    {
      header: 'Product Information',
      filterable: true,
      filterPlaceholder: 'Search name...',
      render: (medicine) => (
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 transition-colors group-hover:text-orange-600">
            <span className="material-symbols-outlined text-xl">medication</span>
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900 transition-colors group-hover:text-orange-700">{medicine.medicineName}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-tighter text-slate-400 opacity-70">
              ID: {medicine.medicineId.split('-')[0]}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Batch & Expiry',
      filterable: true,
      filterPlaceholder: 'Batch...',
      render: (medicine) => (
        <div className="space-y-1">
          <p className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-black tracking-tighter text-slate-700">
            {medicine.batchNumber || 'NO_BATCH'}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <span className="material-symbols-outlined text-[12px] text-slate-400">calendar_today</span>
            <span className={medicine.expiryDate && new Date(medicine.expiryDate) < new Date() ? 'font-black text-red-600' : 'text-slate-500'}>
              {medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Levels',
      render: (medicine) => (
        <div className="min-w-[100px] space-y-1.5">
          <div className="flex items-end justify-between">
            <p className="text-base font-black leading-none tracking-tighter text-slate-900">{medicine.quantity || 0}</p>
            <p className="text-[8px] font-black uppercase tracking-tighter text-slate-400">Units</p>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                (medicine.quantity || 0) === 0
                  ? 'w-0'
                  : (medicine.quantity || 0) < (medicine.reorderLevel ?? 50)
                    ? 'w-1/3 bg-orange-500'
                    : 'w-[85%] bg-emerald-500'
              }`}
            />
          </div>
        </div>
      )
    },
    {
      header: 'Unit Price',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (medicine) => (
        <div>
          <p className="text-sm font-black tracking-tighter text-slate-900">Rs. {medicine.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] font-bold uppercase tracking-tight text-slate-400 opacity-50">M.R.P</p>
        </div>
      )
    },
    {
      header: 'Status',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'In Stock', value: 'IN_STOCK' },
        { label: 'Low Stock', value: 'LOW_STOCK' },
        { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
        { label: 'Expired', value: 'EXPIRED' },
        { label: 'Expiring Soon', value: 'EXPIRING_SOON' }
      ],
      className: 'text-center',
      headerClassName: 'text-center',
      render: (medicine) => {
        const qty = Number(medicine.quantity || 0);
        const reorderLevel = Number(medicine.reorderLevel || 50); // Fallback to 50 if 0, undefined, or null
        const isOutOfStock = qty === 0;
        const isLowStock = qty < reorderLevel && qty > 0;
        
        const expiryDate = medicine.expiryDate ? new Date(medicine.expiryDate) : null;
        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        const isExpired = expiryDate ? expiryDate < today : false;
        const isExpiringSoon = expiryDate ? (expiryDate >= today && expiryDate < thirtyDaysFromNow) : false;

        if (isExpired && isLowStock) return <Badge variant="red">Expired & Low Stock</Badge>;
        if (isExpired) return <Badge variant="red">Expired</Badge>;
        if (isOutOfStock) return <Badge variant="red">Out of Stock</Badge>;
        
        if (isExpiringSoon && isLowStock) return <Badge variant="orange">Expiring Soon & Low Stock</Badge>;
        if (isExpiringSoon) return <Badge variant="purple">Expiring Soon</Badge>;
        if (isLowStock) return <Badge variant="orange">Low Stock</Badge>;
        
        return <Badge variant="emerald">In Stock</Badge>;
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (medicine) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            icon="add_circle"
            className="h-8 w-8 p-0"
            onClick={() => setSelectedMedicineForStock({ 
              id: medicine.medicineId, 
              name: medicine.medicineName,
              hsnCode: medicine.hsnCode
            })}
            title="Increase Stock"
          />
          <Button
            variant="secondary"
            size="sm"
            icon="visibility"
            className="h-8 w-8 p-0"
            onClick={() => setSelectedMedicineForView({ id: medicine.medicineId, name: medicine.medicineName })}
            title="View Profile"
          />


        </div>
      )
    }
  ];

  const metricItems = [
    { label: 'Total Batches', value: stats.totalElements, icon: 'medical_services', variant: 'slate' as const },
    { label: 'Total Medicines', value: stats.uniqueMedicinesCount, icon: 'inventory', variant: 'blue' as const },
    { label: 'Low Stock Items', value: stats.lowStockCount, icon: 'warning', variant: 'orange' as const, subValue: 'Requires Reorder' },
    { label: 'Expiring Soon', value: stats.expiringSoonCount, icon: 'event_busy', variant: 'purple' as const, subValue: 'Next 30 Days' }
  ];

  return (
    <MainLayout title="Inventory Management" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-4 py-2 md:py-4">
          <PageHeading
            title="Stock Inventory"
            description="Real-time pharmaceutical stock monitoring and batch distribution control."
          >
            <Button
              variant="secondary"
              icon="download"
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
            <Button
              variant="secondary"
              icon={importing ? 'sync' : 'publish'}
              onClick={handleImportClick}
              disabled={importing}
              isLoading={importing}
            >
              Import Excel
            </Button>
            <Button icon="inventory" href="/pharmacy/batch-entry">
              Add Batch Stock
            </Button>
          </PageHeading>

          <MetricsGrid items={metricItems} className="mb-4" />

          <ContentPanel
            className="mb-4"
            toolbar={(
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-4">
                  <div className="w-full max-w-sm">
                    <SearchInput
                      placeholder="Search medicine name or batch..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="min-w-[160px] cursor-pointer rounded-xl border-none bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-50"
                  >
                    <option value="ALL">All Inventory</option>
                    <option value="LOW_STOCK">Low Stock Only</option>
                    <option value="EXPIRED">Expired Medicine</option>
                    <option value="EXPIRING_SOON">Expiring Soon</option>
                  </select>
                </div>
                <Button variant="secondary" icon="download" onClick={handleExport}>Export Excel</Button>
              </div>
            )}
          >
            <Table
              columns={columns}
              data={medicines}
              isLoading={loading}
              emptyMessage="No inventory found matching your criteria."
              onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
              activeFilters={columnFilters}
            />

            <Pagination
              page={page}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              label="medicines"
            />
          </ContentPanel>


        </div>
      </PageSurface>

      {selectedMedicineForStock && (
        <QuickStockAddModal
          medicineId={selectedMedicineForStock.id}
          medicineName={selectedMedicineForStock.name}
          hsnCode={selectedMedicineForStock.hsnCode}
          currentStock={medicines.find((medicine) => medicine.medicineId === selectedMedicineForStock.id)?.quantity || 0}
          onClose={() => setSelectedMedicineForStock(null)}
          onSuccess={refresh}
        />
      )}

      {selectedMedicineForView && (
        <MedicineViewModal
          medicineId={selectedMedicineForView.id}
          onClose={() => setSelectedMedicineForView(null)}
        />
      )}
    </MainLayout>
  );
};
