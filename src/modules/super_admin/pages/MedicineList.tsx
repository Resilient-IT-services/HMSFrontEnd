'use client';

import React from 'react';
import { Table, Column } from '@/components/ui/Table';
import { MedicineResponse } from '@/types/api';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';
import AddMedicineModal from '@/modules/pharmacy/pages/AddMedicineModal';
import EditMedicineModal from '@/modules/pharmacy/pages/EditMedicineModal';
import { useMedicines } from '@/modules/super_admin/hooks/useMedicines';
import { Modal } from '@/components/ui/Modal';

export function MedicineList() {
  const {
    medicines,
    totalMedicines,
    loading,
    searchTerm,
    setSearchTerm,
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

  // Define Columns for the generic Table
  const columns: Column<MedicineResponse>[] = [
    {
      header: 'Medicine Details',
      render: (m) => (
        <div>
          <p className="font-black text-slate-900 text-sm leading-tight">{m.name}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{m.genericName} • {m.strength}</p>
        </div>
      )
    },
    {
      header: 'Category',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (m) => (
        <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase">
          {m.form || m.category}
        </span>
      )
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (m) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMedicine(m);
              setShowEditModal(true);
            }}
            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteMedicine(m.id, m.name);
            }}
            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 transition-all"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
          <span className="material-symbols-outlined text-slate-300">chevron_right</span>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Medicine Master Management</h1>
            <p className="text-slate-500 font-medium">Global catalog for all hospitals. Manage or bulk import via Excel.</p>
          </div>
          <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl flex items-center gap-3">
             <span className="material-symbols-outlined font-black">inventory</span>
             <span className="text-sm font-black uppercase tracking-widest">Total {totalMedicines} Medicines</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">upload_file</span>
            Import Excel
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Medicine
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, generic name or composition..."
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold shadow-sm"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-slate-100 px-3 py-1 rounded-full">
              <span className="text-[10px] font-black text-slate-500 uppercase">{totalMedicines} Medicines</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
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
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-6">
          {selectedMedicine ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden sticky top-8">
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
                    <p className="text-xs font-bold text-primary">{selectedMedicine.scheduleType || 'None'}</p>
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
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                    <span className="text-xs text-slate-400 font-bold uppercase">Generic Name</span>
                    <span className="text-sm font-black text-slate-800">{selectedMedicine.genericName}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-50">
                    <span className="text-xs text-slate-400 font-bold uppercase">Form Factor</span>
                    <span className="text-sm font-black text-slate-800">{selectedMedicine.form || selectedMedicine.category}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-slate-400 font-bold uppercase">Current Stock</span>
                    <span className="text-sm font-black text-emerald-600">{selectedMedicine.currentStock} Units</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Edit Medicine Details
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-20 text-center flex flex-col items-center justify-center h-[500px]">
              <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">info</span>
              <p className="text-slate-400 font-bold">Select a medicine to view detailed information.</p>
            </div>
          )}
        </div>
      </div>

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
              <span className="block mt-2 font-bold text-white/80">Name, Generic Name, Composition, Strength, Form, Manufacturer, Schedule Type, Category.</span>
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
      {showAddModal && <AddMedicineModal onClose={() => setShowAddModal(false)} onSuccess={refresh} />}
      {showEditModal && selectedMedicine && <EditMedicineModal medicine={selectedMedicine} onClose={() => setShowEditModal(false)} onSuccess={refresh} />}
    </div>
  );
}
