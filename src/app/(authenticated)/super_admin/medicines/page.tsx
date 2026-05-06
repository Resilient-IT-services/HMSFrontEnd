'use client';

import React, { useState, useEffect, useRef } from 'react';
import { pharmacyService } from '@/services/pharmacyService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { MedicineResponse } from '@/types/api';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';
import { useDebounce } from '@/hooks/useDebounce';
import AddMedicineModal from '@/modules/pharmacy/pages/AddMedicineModal';
import EditMedicineModal from '@/modules/pharmacy/pages/EditMedicineModal';

export default function MedicineMasterPage() {
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedicines();
  }, [debouncedSearch]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.listMedicines({ search: debouncedSearch, size: 2000 });
      if (response.success && response.data) {
        setMedicines(response.data.content);
        setTotalMedicines(response.data.totalElements);
        if (response.data.content.length > 0 && !selectedMedicine) {
          setSelectedMedicine(response.data.content[0]);
        }
      }
    } catch (error) {
      console.error('Fetch failed', error);
      triggerGlobalToast('Failed to load medicines', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      triggerGlobalToast('Please select an Excel file', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await pharmacyService.importMaster(file);
      if (response.success) {
        triggerGlobalToast(`Import completed. The system is designed to skip medicines that already exist by Name and Composition.`, 'success');
        setFile(null);
        setShowImportModal(false);
        fetchMedicines();
      }
    } catch (error) {
      console.error('Import failed', error);
      triggerGlobalToast('Failed to import medicines', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicine = async (id: string, name: string) => {
    if (!globalThis.confirm(`Are you sure you want to delete "${name}" from the master catalog?`)) return;
    
    try {
      setLoading(true);
      const response = await pharmacyService.deleteMedicine(id);
      if (response.success) {
        triggerGlobalToast('Medicine deleted successfully', 'success');
        if (selectedMedicine?.id === id) setSelectedMedicine(null);
        fetchMedicines();
      }
    } catch (error) {
      console.error('Delete failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
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

          {/* Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Category</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && medicines.length === 0 ? (
                  <tr><td colSpan={3} className="p-12"><LoadingSkeleton /></td></tr>
                ) : (
                  medicines.map((m) => (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedMedicine(m)}
                      className={`cursor-pointer transition-all ${selectedMedicine?.id === m.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-900 text-sm leading-tight">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{m.genericName} • {m.strength}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase">
                          {m.form || m.category}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                    <p className="text-xs font-bold text-primary">{selectedMedicine.scheduledType || 'None'}</p>
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
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-10">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-800">Bulk Import Medicines</h2>
                  <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">close</span>
                  </button>
               </div>
               
               <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="material-symbols-outlined text-5xl text-slate-300">cloud_upload</span>
                  <p className="font-bold text-slate-600">{file ? file.name : 'Select Excel File'}</p>
               </div>

               <div className="mt-8 bg-slate-900 text-white p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-primary">Instructions</h3>
                  <p className="text-xs text-slate-400">Excel columns: Name, Generic Name, Composition, Strength, Form, Manufacturer, Schedule Type, Category.</p>
               </div>

               <div className="mt-8 flex gap-4">
                  <button onClick={() => setShowImportModal(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                  <button onClick={handleUpload} disabled={!file || loading} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                    {loading ? 'Processing...' : 'Start Import'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && <AddMedicineModal onClose={() => setShowAddModal(false)} onSuccess={fetchMedicines} />}
      {showEditModal && selectedMedicine && <EditMedicineModal medicine={selectedMedicine} onClose={() => setShowEditModal(false)} onSuccess={fetchMedicines} />}
    </div>
  );
}
