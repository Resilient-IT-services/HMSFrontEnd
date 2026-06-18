'use client';

import React, { useRef } from 'react';
import { Table, Column } from '@/components/ui/Table';
import { MedicineResponse } from '@/types/api';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';
import AddMedicineModal from '@/modules/pharmacy/pages/AddMedicineModal';
import EditMedicineModal from '@/modules/pharmacy/pages/EditMedicineModal';
import { useMedicines } from '@/modules/super_admin/hooks/useMedicines';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import { pharmacyService } from '@/services/pharmacyService';

const CATEGORY_OPTIONS = [
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'INJECTION',
  'OINTMENT',
  'CREAM',
  'DROPS',
  'INHALER',
  'GEL',
  'LOTION',
  'POWDER',
  'SPRAY',
  'SUSPENSION',
  'VACCINE'
];

const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .split(' ')
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(' ');

export function MedicineList() {
  const {
    medicines,
    totalMedicines,
    loading,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    showImportModal,
    setShowImportModal,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    selectedMedicine,
    setSelectedMedicine,
    file,
    handleFileChange,
    handleUpload,
    handleDeleteMedicine,
    refresh
  } = useMedicines('MEDICINE');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedMedicine(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await pharmacyService.downloadMedicineTemplate();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Medicine_Import_Template.xlsx';
      document.body.append(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download error', error);
    }
  };

  const medicineColumns: Column<MedicineResponse>[] = [
    {
      header: 'Product Details',
      width: '30%',
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} variant="orange" className="h-8 w-8 text-[10px]" />
          <div>
            <p className="text-[13px] font-bold text-slate-900 leading-tight">{m.name}</p>
            <p className="text-[9px] font-bold uppercase text-slate-400">{m.manufacturer || 'General'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Composition / Generic',
      width: '30%',
      render: (m) => (
        <div className="max-w-[300px]">
          <p className="text-[11px] font-semibold text-slate-600 truncate">{m.genericName || '-'}</p>
          <p className="text-[9px] text-slate-400 truncate" title={m.composition}>{m.composition || '-'}</p>
        </div>
      )
    },
    {
      header: 'Type / Str',
      className: 'text-center',
      width: '15%',
      render: (m) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-bold text-slate-700">{m.strength || 'N/A'}</span>
          <span className="text-[9px] font-medium text-slate-400 uppercase">{m.form || m.category || 'General'}</span>
        </div>
      )
    },
    {
      header: 'Tracking',
      className: 'text-center',
      width: '12%',
      render: (m) => (
        <div className="flex justify-center gap-2">
          <div className={cn("size-2 rounded-full shadow-inner", m.isBatchTracked ? "bg-emerald-500" : "bg-slate-100")} title="Batch"></div>
          <div className={cn("size-2 rounded-full shadow-inner", m.isExpiryTracked ? "bg-emerald-500" : "bg-slate-100")} title="Expiry"></div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">B/E</span>
        </div>
      )
    },
    {
      header: 'Actions',
      className: 'text-center',
      width: '120px',
      render: (m) => (
        <div className="flex justify-center items-center gap-2">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setSelectedMedicine(m); setShowEditModal(true); }}
            className="p-2 rounded-lg border hover:bg-slate-100 transition"
            title="Edit"
          >
            ✏️
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDeleteMedicine(m.id, m.name); }}
            className="p-2 rounded-lg border hover:bg-slate-100 transition"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Medicine Catalog">
      <PageSurface maxWidthClassName="max-w-[1400px]" backgroundClassName="bg-white">
        <div className="space-y-8 py-4">
          <PageHeading title="Medicine Master Catalog" description="Global centralized database for pharmaceutical products.">
            <div className="flex gap-2">
              <Button variant="secondary" icon="upload_file" onClick={() => setShowImportModal(true)} className="text-[11px]">Import Medicine</Button>
              <Button icon="add" onClick={() => setShowAddModal(true)} className="text-[11px]">Add New Medicine</Button>
            </div>
          </PageHeading>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-4">
            <div className="flex items-center flex-1 bg-white border border-slate-200 rounded-xl px-4 shadow-sm focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-slate-400 mr-2">search</span>
              <input
                type="text"
                placeholder="Search globally by name, brand, composition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-300"
              />
            </div>

            <div className="w-[200px] shrink-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 w-full bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-primary transition-all appearance-none cursor-pointer shadow-sm"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{formatLabel(opt)}</option>
                ))}
              </select>
            </div>

            <button type="button" onClick={() => refresh()} className="p-2 hover:bg-slate-200 rounded-lg transition-colors shrink-0" title="Refresh">
              <span className="material-symbols-outlined text-[20px] text-slate-400">refresh</span>
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pharmaceutical Master List</h2>
              <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{totalMedicines} Products</span>
            </div>
            
            <div className="min-h-[500px]">
              {loading && medicines.length === 0 ? (
                <div className="p-24 text-center"><LoadingSkeleton /></div>
              ) : (
                <Table columns={medicineColumns} data={medicines} isLoading={loading} hideHeaderOnMobile={false} emptyMessage="No medicines found." />
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Global Catalog v1.2</p>
               <Pagination
                  page={page}
                  totalElements={totalMedicines}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  label="total global catalog items"
                />
            </div>
          </div>
        </div>
      </PageSurface>

      {/* Modals */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Bulk Import Medicines" size="xl">
        <div className="p-10 space-y-6 text-center">
          <div className="flex justify-end -mt-4 mb-2">
            <button 
              onClick={handleDownloadTemplate}
              className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Sample Template
            </button>
          </div>
          <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-100 rounded-[3rem] p-16 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group relative overflow-hidden">
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 group-hover:text-orange-500 transition-all">cloud_upload</span>
            <p className="font-black text-slate-600 uppercase tracking-tight">{file ? file.name : 'Select Medicine Sheet'}</p>
          </div>
          <Button className="w-full py-5 rounded-2xl font-black uppercase tracking-widest" onClick={handleUpload} disabled={!file || loading}>Start Import Process</Button>
        </div>
      </Modal>

      {showAddModal && <AddMedicineModal isOpen={true} onClose={() => setShowAddModal(false)} onSuccess={refresh} />}
      {showEditModal && selectedMedicine && <EditMedicineModal medicine={selectedMedicine} onClose={closeEditModal} onSuccess={refresh} />}
    </MainLayout>
  );
}
