'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { MedicineResponse, MedicineSummaryDTO } from '@/types/api';
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

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getMedicines({
        search: debouncedSearch,
        page: page,
        size: pageSize
      });
      if (response.success && response.data) {
        setMedicines(response.data.content);
        setTotalMedicines(response.data.totalElements);
        
        // Auto-select first medicine if none selected and it's the first page
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
  }, [debouncedSearch, page, pageSize]); // Removed selectedMedicine from dependencies

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
    // If clicking edit, we should ensure the selectedMedicine is updated first if it's not the same
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
          // Trigger automatic download of feedback file
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
          
          alert('Import completed with some issues. Please check the downloaded "Medicine_Import_Feedback.xlsx" file for details, fix the errors, and re-upload.');
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
        <div className="space-y-8 py-4 md:py-8">
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
                      placeholder="Search catalog by medicine name, generic name..."
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

        {/* Excel Import Modal */}
        {showImportModal && (
          <Modal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            title="Import Medicines"
          >
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-orange-100 text-orange-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">file_upload</span>
              </div>
              <p className="text-slate-500 mt-2 font-medium">Duplicate medicines will be automatically identified and skipped.</p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-8 border-4 border-dashed border-slate-100 rounded-[2rem] p-12 hover:border-orange-500/20 hover:bg-orange-50/30 transition-all cursor-pointer group"
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
                {importFile ? (
                  <div className="flex items-center justify-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-emerald-600">task</span>
                    <p className="font-black text-slate-800">{importFile.name}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Select Excel File</p>
                )}
              </div>

              <div className="mt-10 flex gap-4">
                <Button variant="secondary" fullWidth onClick={() => setShowImportModal(false)}>
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={confirmImport}
                  disabled={!importFile || loading}
                  isLoading={loading}
                >
                  Start Import
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Add Medicine Modal */}
        {showAddModal && (
          <AddMedicineModal
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && medicineToDelete && (
          <Modal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setMedicineToDelete(null);
            }}
            title="Confirm Deletion"
            size="sm"
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">delete_forever</span>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Delete Medicine?</h3>
              <p className="text-slate-500 text-sm">
                Are you sure you want to remove <span className="font-bold text-slate-800">"{medicineToDelete.name}"</span> from the master catalog? This action cannot be undone.
              </p>

              <div className="mt-10 flex gap-4">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowDeleteModal(false);
                    setMedicineToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  className="bg-red-600 hover:bg-red-700 shadow-red-200 text-white"
                  onClick={handleDeleteMedicine}
                  isLoading={loading}
                >
                  Delete Medicine
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </PageSurface>
    </MainLayout>
  );
};
