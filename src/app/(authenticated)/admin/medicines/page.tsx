'use client';

import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { MedicineResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';
import { useDebounce } from '@/hooks/useDebounce';

import AddMedicineModal from '@/modules/pharmacy/pages/AddMedicineModal';
import EditMedicineModal from '@/modules/pharmacy/pages/EditMedicineModal';

export default function AdminMedicinePage() {
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedicines();
  }, [debouncedSearch]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getMedicines({ search: debouncedSearch, size: 2000 });
      if (response.success && response.data) {
        setMedicines(response.data.content);
        setTotalMedicines(response.data.totalElements);
        if (response.data.content.length > 0 && !selectedMedicine) {
          setSelectedMedicine(response.data.content[0]);
        }
      } else {
        setMedicines([]);
        setTotalMedicines(0);
      }
    } catch (error) {
      console.error(error);
      setMedicines([]);
      setTotalMedicines(0);
    } finally {
      setLoading(false);
    }
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
      triggerGlobalToast('Failed to import data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicine = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the master catalog?`)) return;
    
    try {
      setLoading(true);
      const response = await pharmacyApi.deleteMedicine(id);
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
    <MainLayout title="Medicine Master Catalog">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {/* Stats & Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="bg-orange-100 text-orange-700 px-6 py-3 rounded-2xl flex items-center gap-3">
              <span className="material-symbols-outlined font-black">inventory</span>
              <span className="text-sm font-black uppercase tracking-widest">Total {totalMedicines} Medicines</span>
            </div>
            <div className="flex-1 relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 transition-all" 
                placeholder="Search catalog..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowImportModal(true)} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-orange-700 transition-all">
                <span className="material-symbols-outlined">file_upload</span>
              </button>
              <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-800 transition-all shadow-lg shadow-orange-700/20">
                Add Medicine
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Category</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={3} className="p-12"><LoadingSkeleton /></td></tr>
                ) : (
                  medicines.map((m) => (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedMedicine(m)}
                      className={`cursor-pointer transition-all ${selectedMedicine?.id === m.id ? 'bg-orange-50/50 border-l-4 border-orange-700' : 'hover:bg-slate-50'}`}
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
                          className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all"
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

        {/* Info Panel / Details */}
        <div className="space-y-6">
          {selectedMedicine ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden sticky top-24">
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
                    <p className="text-xs font-bold text-orange-400">{selectedMedicine.scheduledType || 'None'}</p>
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
                  Edit Medicine Master
                </button>
              </div>
            </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-orange-100 text-orange-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">file_upload</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800">Import Medicines</h2>
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
                <button onClick={() => setShowImportModal(false)} className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button 
                  onClick={confirmImport}
                  disabled={!importFile || loading}
                  className="flex-1 py-4 bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-700/20"
                >
                  {loading ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
    </MainLayout>
  );
}
