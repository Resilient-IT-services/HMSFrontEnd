'use client';

import React, { useState } from 'react';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { MedicineRequestDTO } from '@/types/api';
import { Modal } from '@/components/ui/Modal';

interface AddConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddConsumableModal: React.FC<AddConsumableModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MedicineRequestDTO>({
    itemType: 'CONSUMABLE',
    department: 'PHARMACY',
    name: '',
    itemCode: '',
    category: 'General',
    baseUnit: 'PCS',
    manufacturer: '',
    thresholdQuantity: 0,
    taxPercentage: 12,
    hsnCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Item name is required';
    if (!formData.itemCode?.trim()) newErrors.itemCode = 'Item code is required';
    if (!formData.category?.trim()) newErrors.category = 'Category is required';
    if (!formData.baseUnit?.trim()) newErrors.baseUnit = 'Base unit is required';
    if (!formData.manufacturer?.trim()) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.department) newErrors.department = 'Department is required';
    
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

      // Duplicate check by code or name in dept
      const existingRes = await pharmacyApi.getMedicines({ 
        search: formData.itemCode,
        size: 10 
      });

      if (existingRes.success && existingRes.data) {
        const isDuplicate = existingRes.data.content.some(m => 
          m.itemCode?.toLowerCase().trim() === formData.itemCode?.toLowerCase().trim()
        );

        if (isDuplicate) {
          triggerGlobalToast('Item code already exists in catalog', 'warning');
          setLoading(false);
          return;
        }
      }

      const response = await pharmacyApi.addMedicine(formData);
      if (response.success) {
        triggerGlobalToast('Consumable added to master catalog', 'success');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to add consumable', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Consumable"
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="p-8 space-y-8 text-left">
        <div className="bg-blue-50 p-6 rounded-[1.5rem] border border-blue-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Consumable Item Master</h4>
            <p className="text-xs text-blue-800 font-medium">Add a new supply item, lab material or pharmacy consumable.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Item Name</label>
            <input 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold ${errors.name ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="e.g. Syringe 5ml with Needle" 
              type="text"
            />
            {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Item Code (Unique)</label>
            <input 
              name="itemCode"
              value={formData.itemCode}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold ${errors.itemCode ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="e.g. CON1001" 
              type="text"
            />
            {errors.itemCode && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.itemCode}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Department</label>
            <select 
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold appearance-none cursor-pointer"
            >
              <option value="PHARMACY">PHARMACY</option>
              <option value="LABORATORY">LABORATORY</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Category</label>
            <input 
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold ${errors.category ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="e.g. Disposable, Glassware" 
              type="text"
            />
            {errors.category && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Base Unit</label>
            <input 
              name="baseUnit"
              value={formData.baseUnit}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold ${errors.baseUnit ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="e.g. PCS, PKT, BOX" 
              type="text"
            />
            {errors.baseUnit && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.baseUnit}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Manufacturer / Brand</label>
            <input 
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold ${errors.manufacturer ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="e.g. BD India, Borosil" 
              type="text"
            />
            {errors.manufacturer && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.manufacturer}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">HSN Code</label>
            <input 
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold" 
              placeholder="e.g. 9018" 
              type="text"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Low Stock Alert Level</label>
            <input 
              name="thresholdQuantity"
              value={formData.thresholdQuantity}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold" 
              placeholder="e.g. 100" 
              type="number"
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
            className="px-10 py-3.5 rounded-2xl bg-blue-600 font-black text-xs uppercase tracking-widest text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">save</span>
            )}
            {loading ? 'Saving...' : 'Add Consumable'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddConsumableModal;
