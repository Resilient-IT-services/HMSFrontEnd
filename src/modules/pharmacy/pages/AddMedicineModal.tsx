'use client';

import React, { useState } from 'react';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { pharmacyApi } from '../api/pharmacyApi';
import { MedicineRequestDTO } from '@/types/api';

interface AddMedicineModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MedicineRequestDTO>({
    name: '',
    genericName: '',
    composition: '',
    strength: '',
    form: 'Tablet',
    manufacturer: '',
    scheduleType: 'None',
    category: 'General',
    reorderLevel: 50,
    taxPercentage: 12,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number.parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await pharmacyApi.addMedicine(formData);
      if (response.success) {
        triggerGlobalToast('Medicine added to master catalog successfully', 'success');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to add medicine', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-700 text-white rounded-2xl shadow-lg shadow-orange-700/20">
              <span className="material-symbols-outlined leading-none">add_circle</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Add New Medicine</h1>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Global Master Catalog</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Medicine Name</label>
              <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold" 
                placeholder="e.g. Paracetamol 500mg" 
                type="text"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Generic Name</label>
              <input 
                name="genericName"
                value={formData.genericName}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold" 
                placeholder="e.g. Acetaminophen" 
                type="text"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Strength</label>
              <input 
                name="strength"
                value={formData.strength}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold" 
                placeholder="e.g. 500mg, 5ml" 
                type="text"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Salt / Composition</label>
              <textarea 
                name="composition"
                value={formData.composition}
                onChange={handleChange}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold resize-none" 
                placeholder="List chemical composition..." 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Form / Category</label>
              <select 
                name="form"
                value={formData.form}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="Tablet">Tablet</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Capsule">Capsule</option>
                <option value="Ointment">Ointment</option>
                <option value="Drops">Drops</option>
                <option value="Inhaler">Inhaler</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Schedule Drug</label>
              <select 
                name="scheduleType"
                value={formData.scheduleType}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="None">None (General)</option>
                <option value="Schedule H">Schedule H</option>
                <option value="Schedule H1">Schedule H1</option>
                <option value="Schedule X">Schedule X</option>
                <option value="Schedule G">Schedule G</option>
                <option value="Narcotic">Narcotic</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Manufacturer</label>
              <input 
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold" 
                placeholder="e.g. PharmaCorp India" 
                type="text"
              />
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 rounded-2xl border border-slate-200 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-10 py-3.5 rounded-2xl bg-orange-700 font-black text-xs uppercase tracking-widest text-white hover:bg-orange-800 transition-all shadow-xl shadow-orange-700/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">save</span>
              )}
              {loading ? 'Saving to Master...' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicineModal;