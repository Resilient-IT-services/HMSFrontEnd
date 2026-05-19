'use client';

import React, { useState } from 'react';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { pharmacyApi } from '../api/pharmacyApi';
import { MedicineRequestDTO } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { MEDICINE_FORM_OPTIONS, MEDICINE_SCHEDULE_OPTIONS } from '@/utils/enumOptions';

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
    form: 'TABLET',
    manufacturer: '',
    scheduleType: 'OTC',
    category: 'General',
    reorderLevel: 50,
    taxPercentage: 12,
    currentStock: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Medicine name is required';
    if (formData.currentStock !== undefined && formData.currentStock < 0) newErrors.currentStock = 'Initial stock cannot be negative';
    if (formData.reorderLevel !== undefined && formData.reorderLevel < 0) newErrors.reorderLevel = 'Reorder level cannot be negative';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number.parseFloat(value) || 0 : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      triggerGlobalToast('Please correct form errors', 'error');
      return;
    }
    
    try {
      setLoading(true);

      // Check for duplicate in master catalog (Name + Composition check)
      const existingRes = await pharmacyApi.getMedicines({ 
        search: formData.name,
        size: 50 
      });

      if (existingRes.success && existingRes.data) {
        const isDuplicate = existingRes.data.content.some(m => 
          m.name.toLowerCase().trim() === formData.name.toLowerCase().trim() && 
          (m.composition || '').toLowerCase().trim() === (formData.composition || '').toLowerCase().trim()
        );

        if (isDuplicate) {
          triggerGlobalToast('Medicine with this name and composition already exists in the catalog', 'warning');
          setLoading(false);
          return;
        }
      }

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add New Medicine"
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="bg-orange-50 p-6 rounded-[1.5rem] border border-orange-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-700/20 shrink-0">
            <span className="material-symbols-outlined">add_circle</span>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Global Master Catalog</h4>
            <p className="text-xs text-orange-800 font-medium">Register a new pharmaceutical product in the system database.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Medicine Name</label>
            <input 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold ${errors.name ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="e.g. Paracetamol 500mg" 
              type="text"
            />
            {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.name}</p>}
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
              {MEDICINE_FORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
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
              {MEDICINE_SCHEDULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
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
            {loading ? 'Saving...' : 'Add to Catalog'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMedicineModal;
