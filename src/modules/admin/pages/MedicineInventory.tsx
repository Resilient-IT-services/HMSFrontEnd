'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { MedicineResponse } from '@/types/api';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { ContentPanel } from '@/components/ui/ContentPanel';
import { SearchInput } from '@/components/ui/SearchInput';

import AddMedicineModal from '@/modules/pharmacy/pages/AddMedicineModal';
import EditMedicineModal from '@/modules/pharmacy/pages/EditMedicineModal';

import { Table, Column } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { DEFAULT_DEBOUNCE_MS, DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { FileSpreadsheet, CheckCircle2, RefreshCw, AlertCircle, Trash2, HelpCircle } from 'lucide-react';

export const MedicineInventory = () => {
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, DEFAULT_DEBOUNCE_MS);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<{id: string, name: string} | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<string | undefined>();
  const debouncedColumnFilters = useDebounce(columnFilters, DEFAULT_DEBOUNCE_MS);

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getMedicines({
        search: debouncedSearch,
        page: page,
        size: pageSize,
        sort,
        ...debouncedColumnFilters
      });
      if (response.success && response.data) {
        setMedicines(response.data.content);
        setTotalMedicines(response.data.totalElements);

        if (response.data.content.length > 0 && !selectedMedicine && page === 0) {
          const firstId = response.data.content[0].id;
          const detailRes = await pharmacyApi.getMedicineById(firstId);
          if (detailRes.success && detailRes.data) {
            setSelectedMedicine(detailRes.data);
          }
        }
      } else {
        setMedicines([]);
        setTotalMedicines(0);
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      setMedicines([]);
      setTotalMedicines(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, debouncedColumnFilters, sort, selectedMedicine]);

  useEffect(() => {
    const trigger = async () => {
      await fetchMedicines();
    };
    void trigger();
  }, [fetchMedicines]);

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
      console.error('Failed to fetch medicine details:', error);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const confirmImport = async () => {
    if (!importFile) return;
    setLoading(true);
    try {
      const response = await pharmacyApi.importMedicines(importFile);
      if (response.success && response.data) {
        const { importedRows, skippedRows, failedRows, errorFileBase64 } = response.data;

        if (failedRows === 0 && importedRows === 0 && skippedRows > 0) {
          triggerGlobalToast('All medicines in the file already exist in the database.', 'info');
        } else {
          triggerGlobalToast(
              `Import Results - Success: ${importedRows}, Skipped: ${skippedRows}, Failed: ${failedRows}`,
              failedRows > 0 ? 'warning' : 'success'
          );
        }

        if (errorFileBase64) {
          const byteCharacters = atob(errorFileBase64);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.codePointAt(i)!;
          }
          const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

          const link = document.createElement('a');
          link.href = globalThis.URL.createObjectURL(blob);
          link.download = 'Medicine_Import_Feedback.xlsx';
          link.click();

          alert('Import completed with some issues. Please check the downloaded "Medicine_Import_Feedback.xlsx" file for details.');
        }

        setShowImportModal(false);
        setImportFile(null);
        fetchMedicines();
      }
    } catch (error) {
      console.error('Failed to import medicines:', error);
      triggerGlobalToast('Failed to import data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicine = async () => {
    if (!medicineToDelete) return;

    try {
      setLoading(true);
      const response = await pharmacyApi.deleteMedicine(medicineToDelete.id);
      if (response.success) {
        triggerGlobalToast('Medicine deleted successfully', 'success');
        if (selectedMedicine?.id === medicineToDelete.id) setSelectedMedicine(null);
        setShowDeleteModal(false);
        setMedicineToDelete(null);
        fetchMedicines();
      }
    } catch (error) {
      console.error('Failed to delete medicine:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<MedicineResponse>[] = [
    {
      header: 'Medicine Details',
      render: (m) => (
          <div className="flex items-center gap-3">
            <Avatar name={m.name} variant="orange" />
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">{m.name}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-tighter text-slate-400">{m.manufacturer || 'Unknown Manufacturer'} • {m.strength}</p>
            </div>
          </div>
      )
    },
    {
      header: 'Generic Name',
      render: (m) => (
          <span className="text-xs font-bold text-slate-700">{m.genericName}</span>
      )
    },
    {
      header: 'Composition',
      render: (m) => (
          <span className="text-[10px] text-slate-500 font-medium line-clamp-2 max-w-[200px]" title={m.composition}>
          {m.composition || '-'}
        </span>
      )
    },
    {
      header: 'HSN Code',
      render: (m) => (
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.hsnCode || '-'}</span>
      )
    },
    {
      header: 'Category',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (m) => (
          <Badge variant="slate" size="sm">{m.form || m.category}</Badge>
      )
    },
    {
      header: 'Threshold',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (m) => (
          <span className="text-xs font-bold text-orange-600">{m.thresholdQuantity ?? m.reorderLevel ?? 10}</span>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (m) => (
          <div className="flex justify-end items-center gap-2">
            <Button
                variant="secondary"
                size="sm"
                icon="edit"
                onClick={(e) => {
                  e.stopPropagation();
                  void openEditModal(m.id);
                }}
            />
            <Button
                variant="secondary"
                size="sm"
                icon="delete"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setMedicineToDelete({ id: m.id, name: m.name });
                  setShowDeleteModal(true);
                }}
            />
          </div>
      )
    }
  ];

  return (
      <MainLayout title="Medicine Master Catalog">
        <PageSurface
            maxWidthClassName="max-w-[1600px]"
            backgroundClassName="bg-[#f8f9fb]"
            fontClassName="font-inter"
        >
          <div className="space-y-4 py-2 md:py-4">
            <PageHeading
                title="Medicine Master Catalog"
                description="Manage and monitor the central medicine inventory and pharmaceutical master data."
            >
              <div className="flex gap-2">
                <Button variant="secondary" icon="file_upload" onClick={() => setShowImportModal(true)}>
                  Import
                </Button>
                <Button icon="add" onClick={() => setShowAddModal(true)}>
                  Add Medicine
                </Button>
              </div>
            </PageHeading>

            <ContentPanel
                toolbar={(
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-1 items-center gap-4">
                        <div className="w-full max-w-xl">
                          <SearchInput
                              placeholder="Search by name, generic name, composition or HSN code..."
                              value={searchTerm}
                              onChange={(e) => handleSearchChange(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button variant="secondary" icon="refresh" isLoading={loading} onClick={() => fetchMedicines()} />
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
                  label="medicines"
              />
            </ContentPanel>
          </div>

          {/* New Custom Sexy Framework Import Modal */}
          {showImportModal && (
              <Modal
                  isOpen={showImportModal}
                  onClose={() => setShowImportModal(false)}
                  title="Import Inventory Sheet"
                  width="430px"
              >
                <div className="p-4 flex flex-col h-auto bg-[var(--surface)] overflow-hidden justify-start items-stretch">

                  {/* Micro Info bar */}
                  <div className="mb-3.5 flex gap-2 items-center p-2.5 bg-[var(--primary-light)]/10 border border-[var(--primary-light)]/20 rounded-xl">
                    <AlertCircle className="size-3.5 text-[var(--primary)] shrink-0" />
                    <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wide opacity-80">
                      System auto-skips duplicate entries smoothly.
                    </p>
                  </div>

                  {/* High Tech Dropzone */}
                  <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border rounded-xl p-5 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[115px] h-auto relative overflow-hidden group ${
                          importFile
                              ? 'border-emerald-500 bg-emerald-50/10'
                              : 'border-[var(--border)] bg-[var(--background)]/40 hover:border-[var(--primary)]'
                      }`}
                  >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv, .xlsx, .xls"
                        onChange={handleFileChange}
                    />

                    {importFile ? (
                        <div className="flex flex-col items-center gap-1.5 animate-in scale-in-95 duration-150">
                          <div className="size-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                            <CheckCircle2 className="size-4" />
                          </div>
                          <div className="text-center px-1">
                            <p className="text-xs font-bold text-[var(--text-primary)] max-w-[260px] truncate">
                              {importFile.name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">
                              {(importFile.size / 1024).toFixed(1)} KB • Ready
                            </p>
                          </div>
                          <span className="text-[9px] text-[var(--primary)] font-black uppercase tracking-wider flex items-center gap-1 mt-1 bg-[var(--primary-light)]/40 px-2.5 py-1 rounded-lg">
                            <RefreshCw className="size-2.5" /> Change
                          </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="size-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm text-[var(--primary)] flex items-center justify-center transition-transform group-hover:-translate-y-0.5">
                            <FileSpreadsheet className="size-4.5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                              Choose spreadsheet template
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Supports standard .xlsx, .xls, or .csv formats
                            </p>
                          </div>
                        </div>
                    )}
                  </div>

                  {/* Clean Non-Stretching Action bar */}
                  <div className="mt-4 grid grid-cols-2 gap-3 flex-initial">
                    <button
                        onClick={() => setShowImportModal(false)}
                        className="py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-[var(--border)]"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={confirmImport}
                        disabled={!importFile || loading}
                        className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center shadow-sm ${
                            !importFile || loading
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                                : 'bg-[var(--primary)] text-white hover:opacity-95 shadow-[var(--primary-light)]/40 hover:shadow-md'
                        }`}
                    >
                      {loading ? 'Processing...' : 'Start Import'}
                    </button>
                  </div>
                </div>
              </Modal>
          )}

          {/* Add Medicine Modal */}
          {showAddModal && (
              <AddMedicineModal
                  isOpen={true}
                  onClose={() => setShowAddModal(false)}
                  onSuccess={fetchMedicines}
              />
          )}

          {/* Edit Medicine Modal */}
          {showEditModal && selectedMedicine && (
              <EditMedicineModal
                  medicine={selectedMedicine}
                  onClose={() => setShowEditModal(false)}
                  onSuccess={fetchMedicines}
              />
          )}

          {/* Ultra-Sexy & High Contrast Unique Delete Confirmation Modal */}
          {showDeleteModal && medicineToDelete && (
              <Modal
                  isOpen={showDeleteModal}
                  onClose={() => {
                    setShowDeleteModal(false);
                    setMedicineToDelete(null);
                  }}
                  title="Inventory Action Required"
                  width="420px"
              >
                <div className="p-4 flex flex-col h-auto max-h-fit justify-start items-stretch bg-[var(--surface)] overflow-hidden">

                  {/* Modern Horizontal Alert Stripe header layout style */}
                  <div className="flex gap-3.5 items-center p-3 bg-[var(--error-light)]/10 border border-[var(--error-light)]/20 rounded-xl mb-4 text-left">
                    <div className="size-9 rounded-xl bg-[var(--error-light)] text-[var(--error)] flex items-center justify-center shrink-0 border border-[var(--error)]/10 shadow-sm shadow-[var(--error-light)]/30">
                      <Trash2 className="size-4.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                        Confirm Permanent Deletion
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">
                        This sequence will remove master data variables.
                      </p>
                    </div>
                  </div>

                  {/* Inline focus prompt card context block */}
                  <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 text-center mb-4">
                    <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                      Are you sure you want to completely erase
                    </p>
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate max-w-full px-2 mt-1 bg-[var(--surface)] py-1.5 rounded-lg border border-[var(--border)]">
                      {medicineToDelete.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-2 tracking-wider flex items-center justify-center gap-1">
                      <HelpCircle className="size-3 text-[var(--error)]" /> This record pipeline cannot be reversed
                    </p>
                  </div>

                  {/* Tightly bound flush actions grid layout matrix */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                        type="button"
                        onClick={() => {
                          setShowDeleteModal(false);
                          setMedicineToDelete(null);
                        }}
                        className="py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-[var(--border)]"
                    >
                      Cancel Action
                    </button>
                    <button
                        type="button"
                        onClick={handleDeleteMedicine}
                        disabled={loading}
                        className="py-2.5 bg-[var(--error)] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-[var(--error-light)]/40 hover:opacity-95"
                    >
                      {loading ? 'Purging...' : 'Delete Master'}
                    </button>
                  </div>
                </div>
              </Modal>
          )}
        </PageSurface>
      </MainLayout>
  );
};