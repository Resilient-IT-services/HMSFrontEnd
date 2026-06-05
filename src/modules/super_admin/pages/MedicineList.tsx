'use client';

import React from 'react';
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
import { Badge } from '@/components/ui/Badge';

const DEFAULT_CATEGORY_OPTIONS = [
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'INJECTION',
  'OINTMENT',
  'CREAM',
  'DROPS',
  'INHALER'
];

const formatCategoryLabel = (value: string) =>
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
    categoryFilter: selectedCategory,
    setCategoryFilter: setSelectedCategory,
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
  } = useMedicines();

  const categories = React.useMemo(() => {
    const values = new Set(DEFAULT_CATEGORY_OPTIONS);
    medicines.forEach((medicine) => {
      const category = medicine.form || medicine.category;
      if (category) values.add(category);
    });
    return [...values].toSorted((a, b) => formatCategoryLabel(a).localeCompare(formatCategoryLabel(b)));
  }, [medicines]);

  // Define Columns for the generic Table
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
      headerClassName: 'text-center',
      className: 'text-center',
      render: (m) => (
        <Badge variant="slate" size="sm">{m.form || m.category}</Badge>
      )
    },
    {
      header: 'HSN Code',
      render: (m) => (
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.hsnCode || '-'}</span>
      )
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (m) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="edit"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMedicine(m);
              setShowEditModal(true);
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            icon="delete"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteMedicine(m.id, m.name);
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
            title="Medicine Master Management"
            description="Global catalog for all hospitals. Manage or bulk import via Excel."
          >
            <div className="flex gap-2">
              <Button variant="secondary" icon="upload_file" onClick={() => setShowImportModal(true)}>
                Import Excel
              </Button>
              <Button icon="add" onClick={() => setShowAddModal(true)}>
                Add Medicine
              </Button>
            </div>
          </PageHeading>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-3 space-y-6">
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-6">
                <div className="flex items-center gap-4 w-full">
                  <input
                    type="text"
                    placeholder="Search by name, generic name or composition..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none"
                  />

                  <div
                    style={{
                      width: "220px",
                      minWidth: "220px",
                      height: "48px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 12px"
                    }}
                  >
                    <select
                      value={selectedCategory || ""}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <option value="">All Category</option>

                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {formatCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => refresh()}
                    className="h-12 w-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center"
                  >
                    ↻
                  </button>
                </div>

                {loading && medicines.length === 0 ? (
                  <div className="p-12"><LoadingSkeleton /></div>
                ) : (
                  <Table 
                    columns={columns} 
                    data={medicines} 
                    isLoading={loading}
                    onRowClick={(m) => setSelectedMedicine(m)}
                    rowClassName={(m) => selectedMedicine?.id === m.id ? 'bg-primary/5 border-l-4 border-primary' : ''}
                  />
                )}
                <Pagination
                  page={page}
                  totalElements={totalMedicines}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  label="medicines"
                />
              </div>
            </div>
          </div>
        </div>
      </PageSurface>

        {/* Import Modal */}
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Bulk Import Medicines"
          size="2xl"
        >
          <div className="p-8 space-y-8">
            <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group">
              <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-primary transition-all duration-300">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
              </div>
              <p className="font-black text-slate-600 text-sm uppercase tracking-tight">{file ? file.name : 'Click or Drag Excel File'}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Supported formats: .xlsx, .xls</p>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-[1.5rem] space-y-3 relative overflow-hidden shadow-xl shadow-slate-900/10">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10 -rotate-12">info</span>
              <h3 className="font-black text-xs uppercase tracking-widest text-primary leading-none mb-2">Requirement Protocol</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your Excel sheet must contain the following columns in order:
                <span className="block mt-2 font-bold text-white/80">Name, Generic Name, Composition, Strength, Form, Manufacturer, Schedule Type, Category, Threshold Quantity (Min Stock), HSN Code.</span>
                <span className="block mt-1 text-[10px] text-primary font-bold italic">Note: HSN Code should be in Column J (Index 9).</span>
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowImportModal(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
              <button 
                onClick={handleUpload} 
                disabled={!file || loading} 
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-40"
              >
                {loading ? 'Processing Batch...' : 'Begin Bulk Import'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modals */}
        {showAddModal && <AddMedicineModal isOpen={true} onClose={() => setShowAddModal(false)} onSuccess={refresh} />}
        {showEditModal && selectedMedicine && <EditMedicineModal medicine={selectedMedicine} onClose={() => setShowEditModal(false)} onSuccess={refresh} />}
    </MainLayout>
  );
}
