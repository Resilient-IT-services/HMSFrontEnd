'use client';

import React, { useState } from 'react';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { pharmacyApi } from '../api/pharmacyApi';
import { MedicineRequestDTO, MedicineResponse } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { MEDICINE_FORM_OPTIONS, MEDICINE_SCHEDULE_OPTIONS } from '@/utils/enumOptions';

interface EditMedicineModalProps {
  medicine: MedicineResponse;
  onClose: () => void;
  onSuccess: () => void;
}

const EditMedicineModal: React.FC<EditMedicineModalProps> = ({ medicine, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MedicineRequestDTO>({
    name: medicine.name,
    genericName: medicine.genericName || '',
    composition: medicine.composition || '',
    strength: medicine.strength || '',
    form: medicine.form || 'TABLET',
    manufacturer: medicine.manufacturer || '',
    scheduleType: medicine.scheduleType || 'OTC',
    category: medicine.category || 'General',
    reorderLevel: medicine.reorderLevel || 50,
    taxPercentage: medicine.taxPercentage || 12,
    currentStock: medicine.currentStock || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Medicine name is required';
    if (!formData.genericName?.trim()) newErrors.genericName = 'Generic name is required';
    if (!formData.composition?.trim()) newErrors.composition = 'Salt/Composition is required';
    if (!formData.strength?.trim()) newErrors.strength = 'Strength is required';
    if (!formData.form) newErrors.form = 'Form is required';
    if (!formData.manufacturer?.trim()) newErrors.manufacturer = 'Manufacturer is required';
    
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
      const response = await pharmacyApi.updateMedicine(medicine.id, formData);
      if (response.success) {
        triggerGlobalToast('Medicine updated successfully', 'success');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update medicine', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Medicine"
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="bg-orange-50 p-6 rounded-[1.5rem] border border-orange-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-700/20 shrink-0">
            <span className="material-symbols-outlined">edit</span>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight leading-none mb-1">Update Master Catalog</h4>
            <p className="text-xs text-slate-500 font-medium">Modify existing pharmaceutical product details in the system.</p>
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
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold ${errors.genericName ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="e.g. Acetaminophen" 
              type="text"
            />
            {errors.genericName && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.genericName}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Strength</label>
            <input 
              name="strength"
              value={formData.strength}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold ${errors.strength ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="e.g. 500mg, 5ml" 
              type="text"
            />
            {errors.strength && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.strength}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Salt / Composition</label>
            <textarea 
              name="composition"
              value={formData.composition}
              onChange={handleChange}
              rows={2}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold resize-none ${errors.composition ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="List chemical composition..." 
            />
            {errors.composition && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.composition}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Form / Category</label>
            <select 
              name="form"
              value={formData.form}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold appearance-none cursor-pointer ${errors.form ? 'border-red-500' : 'border-slate-200'}`}
            >
              {MEDICINE_FORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {errors.form && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.form}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Schedule Drug</label>
            <select 
              name="scheduleType"
              value={formData.scheduleType}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-orange-500 outline-none transition-all font-bold appearance-none cursor-pointer"
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
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold ${errors.manufacturer ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="e.g. PharmaCorp India" 
              type="text"
            />
            {errors.manufacturer && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.manufacturer}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Low Stock Label (Units)</label>
            <input 
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold ${errors.reorderLevel ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="e.g. 50" 
              type="number"
            />
            {errors.reorderLevel && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.reorderLevel}</p>}
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
            className="px-10 py-3.5 rounded-2xl bg-orange-600 font-black text-xs uppercase tracking-widest text-white hover:bg-orange-600 transition-all shadow-xl shadow-blue-700/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">save</span>
            )}
            {loading ? 'Updating...' : 'Update Medicine'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditMedicineModal;
