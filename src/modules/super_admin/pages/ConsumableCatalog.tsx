'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { pharmacyService } from '@/services/pharmacyService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { MedicineResponse } from '@/types/api';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { ContentPanel } from '@/components/ui/ContentPanel';
import { SearchInput } from '@/components/ui/SearchInput';

import EditMedicineModal from '@/modules/pharmacy/pages/EditMedicineModal';
import AddConsumableModal from './AddConsumableModal';

import { Table, Column } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { DEFAULT_DEBOUNCE_MS, DEFAULT_PAGE_SIZE } from '@/utils/constants';
import {FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, FileDown} from 'lucide-react';

export function ConsumableCatalog() {
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, DEFAULT_DEBOUNCE_MS);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort] = useState<string | undefined>();
  const debouncedColumnFilters = useDebounce(columnFilters, DEFAULT_DEBOUNCE_MS);

  const fetchConsumables = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getMedicines({
        search: debouncedSearch,
        page: page,
        size: pageSize,
        sort,
        itemType: 'CONSUMABLE',
        ...debouncedColumnFilters
      });
      if (response.success && response.data) {
        setMedicines(response.data.content);
        setTotalMedicines(response.data.totalElements);
      } else {
        setMedicines([]);
        setTotalMedicines(0);
      }
    } catch (error) {
      console.error('Failed to fetch consumables:', error);
      setMedicines([]);
      setTotalMedicines(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, debouncedColumnFilters, sort]);

  useEffect(() => {
    const trigger = async () => {
      await fetchConsumables();
    };
    void trigger();
  }, [fetchConsumables]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(0);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const handleRowClick = async (m: MedicineResponse) => {
    try {
      const detailRes = await pharmacyApi.getMedicineById(m.id);
      if (detailRes.success && detailRes.data) {
        setSelectedMedicine(detailRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch details:', error);
    }
  };

  const openEditModal = async (id: string) => {
    if (selectedMedicine?.id !== id) {
      const detailRes = await pharmacyApi.getMedicineById(id);
      if (detailRes.success && detailRes.data) {
        setSelectedMedicine(detailRes.data);
      }
    }
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedMedicine(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await pharmacyService.downloadConsumableTemplate();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Consumable_Import_Template.xlsx';
      document.body.append(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download error', error);
    }
  };

  const confirmImport = async () => {
    if (!importFile) return;
    setLoading(true);
    try {
      const res = await pharmacyService.importInventoryItems(importFile);
      if (res.failureCount === 0) {
        triggerGlobalToast('All records imported successfully.', 'success');
      } else {
        triggerGlobalToast(`Import completed with ${res.failureCount} errors.`, 'warning');
        if (res.errorFileAvailable && res.errorFileBase64) {
          downloadErrorFile(res.errorFileBase64);
        }
      }
      setShowImportModal(false);
      setImportFile(null);
      void fetchConsumables();
    } catch (error: any) {
      console.error('Import failed', error);
      triggerGlobalToast(error?.response?.data?.message || 'Failed to import inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadErrorFile = (base64: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = Array.from({ length: byteCharacters.length }, (_, i) => byteCharacters.codePointAt(i)!);
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consumable_Import_Error_${Date.now()}.xlsx`;
    document.body.append(a);
    a.click();
    globalThis.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true);
      const response = await pharmacyApi.deleteMedicine(itemToDelete.id);
      if (response.success) {
        triggerGlobalToast('Item removed successfully', 'success');
        if (selectedMedicine?.id === itemToDelete.id) setSelectedMedicine(null);
        setShowDeleteModal(false);
        setItemToDelete(null);
        void fetchConsumables();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<MedicineResponse>[] = [
    {
      header: 'Inventory Item',
      width: '35%',
      render: (m) => (
          <div className="flex items-center gap-3">
            <Avatar name={m.name} variant="blue" />
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">{m.name}</p>
              <p className="mt-0.5 text-[10px] font-black uppercase text-primary">CODE: {m.itemCode || 'N/A'}</p>
            </div>
          </div>
      )
    },
    {
      header: 'Manufacturer / Brand',
      render: (m) => (
          <span className="text-xs font-bold text-slate-700">{m.manufacturer || '-'}</span>
      )
    },
    {
      header: 'Classification',
      render: (m) => (
        <div className="space-y-1">
          <Badge variant="blue" size="sm">{m.department || 'N/A'}</Badge>
          <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">{m.category || 'General'}</p>
        </div>
      )
    },
    {
      header: 'Unit',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (m) => (
          <Badge variant="slate" size="sm">{m.baseUnit || 'PCS'}</Badge>
      )
    },
    {
      header: 'Threshold',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (m) => (
          <span className="text-xs font-bold text-orange-600">{m.thresholdQuantity ?? 0}</span>
      )
    },
    {
      header: 'Actions',
      className: 'text-center',
      headerClassName: 'text-center',
      width: '120px',
      render: (m) => (
          <div className="flex justify-center items-center gap-2">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); void openEditModal(m.id); }}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: m.id, name: m.name }); setShowDeleteModal(true); }}
              className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
      )
    }
  ];

  return (
    <MainLayout title="Consumable Master catalog">
      <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
        <div className="space-y-4 py-2 md:py-4">
          <PageHeading title="Consumable Item Master" description="Manage hospital supplies, laboratory materials, and pharmacy consumables centrally.">
            <div className="flex gap-2">
              <Button variant="secondary" icon="file_upload" onClick={() => setShowImportModal(true)}>Import</Button>
              <Button icon="add" onClick={() => setShowAddModal(true)}>Register Item</Button>
            </div>
          </PageHeading>

          <ContentPanel
            toolbar={(
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-4">
                  <div className="w-full max-w-xl">
                    <SearchInput
                      placeholder="Search by name, brand, category or item code..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="secondary" icon="refresh" isLoading={loading} onClick={() => fetchConsumables()} />
              </div>
            )}
          >
            <Table
              columns={columns}
              data={medicines}
              isLoading={loading}
              onRowClick={handleRowClick}
              onRowDoubleClick={(m) => openEditModal(m.id)}
              rowClassName={(m) => selectedMedicine?.id === m.id ? 'bg-primary/5 border-l-4 border-primary' : ''}
              onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
              activeFilters={columnFilters}
            />
            <Pagination
              page={page}
              totalElements={totalMedicines}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              label="consumables"
            />
          </ContentPanel>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Bulk Consumables " width="430px">
            <div className="p-4 flex flex-col gap-4 bg-[var(--surface)]">
              <div className="flex justify-end -mt-2 mb-1">
                <button onClick={handleDownloadTemplate} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1">
                  <FileDown className="size-6.5 " />
                  Download Template
                </button>
              </div>
              <div className="flex gap-2 items-center p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                <AlertCircle className="size-3.5 text-blue-600 shrink-0" />
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide opacity-80">Import standard XLSX consumables template.</p>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="border rounded-xl p-5 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[115px] relative group">
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                {importFile ? (
                  <div className="flex flex-col items-center gap-1.5 animate-in scale-in-95 duration-150">
                    <div className="size-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200"><CheckCircle2 className="size-4" /></div>
                    <p className="text-xs font-bold text-[var(--text-primary)] max-w-[260px] truncate">{importFile.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm text-blue-600 flex items-center justify-center"><FileSpreadsheet className="size-4.5" /></div>
                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Choose File to Import</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setShowImportModal(false)} className="py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--border)]">Cancel</button>
                <button type="button" onClick={confirmImport} disabled={!importFile || loading} className="py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center bg-blue-600 text-white hover:opacity-95 shadow-blue-200 disabled:opacity-40">{loading ? 'Processing...' : 'Start Import'}</button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modals */}
        {showAddModal && <AddConsumableModal isOpen={true} onClose={() => setShowAddModal(false)} onSuccess={fetchConsumables} />}
        {showEditModal && selectedMedicine && <EditMedicineModal medicine={selectedMedicine} onClose={closeEditModal} onSuccess={fetchConsumables} />}

        {/* Delete Modal */}
        {showDeleteModal && itemToDelete && (
          <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setItemToDelete(null); }} title="Consumable Action Required" width="420px">
            <div className="p-4 flex flex-col gap-4 bg-[var(--surface)]">
              <div className="flex gap-3.5 items-center p-3 bg-[var(--error-light)]/10 border border-[var(--error-light)]/20 rounded-xl text-left">
                <div className="size-9 rounded-xl bg-[var(--error-light)] text-[var(--error)] flex items-center justify-center shrink-0 border border-[var(--error)]/10 shadow-sm"><Trash2 className="size-4.5" /></div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">Confirm Permanent Deletion</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">This sequence will remove master data variables.</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 text-center">
                <p className="text-[11px] font-medium text-[var(--text-secondary)]">Are you sure you want to completely erase</p>
                <p className="text-sm font-bold text-[var(--text-primary)] truncate mt-1 bg-[var(--surface)] py-1.5 rounded-lg border border-[var(--border)] px-2">{itemToDelete.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button type="button" onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }} className="py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--border)]">Cancel Action</button>
                <button type="button" onClick={handleDeleteItem} disabled={loading} className="py-2.5 bg-[var(--error)] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-95">{loading ? 'Purging...' : 'Delete Master'}</button>
              </div>
            </div>
          </Modal>
        )}
      </PageSurface>
    </MainLayout>
  );
}
