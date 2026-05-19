'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { MedicineResponse, MedicineSummaryDTO } from '@/types/api';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import AddMedicineModal from '@/modules/pharmacy/pages/AddMedicineModal';
import EditMedicineModal from '@/modules/pharmacy/pages/EditMedicineModal';

import { Table, Column } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { InfoRow } from '@/components/ui/InfoRow';
import { Pagination } from '@/components/ui/Pagination';
import { DEFAULT_DEBOUNCE_MS, DEFAULT_PAGE_SIZE } from '@/utils/constants';

export const MedicineInventory = () => {
  const [medicines, setMedicines] = useState<MedicineSummaryDTO[]>([]);
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
      const response = await pharmacyApi.getMedicinesSummary({ 
        search: debouncedSearch, 
        page: page, 
        size: pageSize 
      });
      if (response.success && response.data) {
        setMedicines(response.data.content);
        setTotalMedicines(response.data.totalElements);
        if (response.data.content.length > 0 && !selectedMedicine) {
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
  }, [debouncedSearch, page, pageSize, selectedMedicine]); // Added selectedMedicine to dependencies

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

  const handleSelectMedicine = async (id: string) => {
    try {
      setLoading(true);
      const res = await pharmacyApi.getMedicineById(id);
      if (res.success && res.data) {
        setSelectedMedicine(res.data);
      }
    } catch (error) {
      console.error('Failed to select medicine:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (id: string) => {
    await handleSelectMedicine(id);
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
      if (response.success) {
        triggerGlobalToast(`Import completed. The system is designed to skip medicines that already exist by Name and Composition.`, 'success');
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

  const columns: Column<MedicineSummaryDTO>[] = [
    {
      header: 'Medicine Details',
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} variant="slate" className="rounded-lg" />
          <div>
            <p className="font-black text-slate-900 text-sm leading-tight">{m.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{m.genericName} • {m.strength}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (m) => (
        <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase">
          {m.form || m.category}
        </span>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (m) => (
        <div className="flex justify-end items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            icon="edit"
            onClick={(e) => {
              e.stopPropagation();
              void openEditModal(m.id);
            }}
          />
          <Button 
            variant="ghost"
            size="sm"
            icon="delete"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setMedicineToDelete({ id: m.id, name: m.name });
              setShowDeleteModal(true);
            }}
          />
          <span className="material-symbols-outlined text-slate-300">chevron_right</span>
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Medicine Master Catalog">
      <PageSurface>
        <PageHeading 
          title="Medicine Master Catalog" 
          description="Manage and monitor the central medicine inventory and pharmaceutical master data."
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            {/* Stats & Actions */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-inter" 
                    placeholder="Search catalog..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" icon="file_upload" onClick={() => setShowImportModal(true)} />
                  <Button icon="add" onClick={() => setShowAddModal(true)}>
                    Add Medicine
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <Table 
                columns={columns}
                data={medicines}
                isLoading={loading}
                onRowClick={(m) => void handleSelectMedicine(m.id)}
                rowClassName={(m) => selectedMedicine?.id === m.id ? 'bg-orange-50/50 border-l-4 border-orange-700' : ''}
              />
              <Pagination
                page={page}
                totalElements={totalMedicines}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                label="medicines"
              />
            </Card>
          </div>

          {/* Info Panel / Details */}
          <div className="space-y-6">
            {selectedMedicine ? (
              <Card className="p-0 overflow-hidden sticky top-24 border-none shadow-xl">
                <div className="p-8 bg-slate-900 text-white">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                      <span className="material-symbols-outlined text-3xl">medication</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{selectedMedicine.name}</h3>
                      <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">{selectedMedicine.manufacturer}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <p className="text-[9px] font-black uppercase text-white/40 mb-1">Schedule Drug</p>
                          <p className="text-xs font-bold text-orange-400">{selectedMedicine.scheduleType || 'OTC'}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <p className="text-[9px] font-black uppercase text-white/40 mb-1">Strength</p>
                      <p className="text-xs font-bold">{selectedMedicine.strength || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Composition / Salt</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                      {selectedMedicine.composition || 'No composition data recorded.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <InfoRow label="Generic Name" value={selectedMedicine.genericName} className="py-3 border-b border-slate-50 flex-row justify-between items-center" />
                    <InfoRow label="Form Factor" value={selectedMedicine.form || selectedMedicine.category} className="py-3 border-b border-slate-50 flex-row justify-between items-center" />

                  </div>
                  <Button 
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowEditModal(true)}
                  >
                    Edit Medicine Master
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-20 text-center flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">info</span>
                <p className="text-slate-400 font-bold">Select a medicine to view detailed information.</p>
              </div>
            )}
          </div>
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
