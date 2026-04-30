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
    composition: '',
    category: 'Tablet',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    currentStock: 0,
    reorderLevel: 50,
    purchasePrice: 0,
    sellingPrice: 0,
    taxPercentage: 12,
    temperature: '',
    humidity: '',
    specialNotes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await pharmacyApi.addMedicine(formData);
      if (response.success) {
        triggerGlobalToast('Medicine added to catalog successfully', 'success');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to add medicine', error);
      triggerGlobalToast('Failed to add medicine to catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
              <span className="material-symbols-outlined leading-none">medication</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Add Medicine to Catalog</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">VitalSync Healthcare</span>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Basic Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-orange-700 text-sm">info</span>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Basic Information</h2>
              </div>
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Medicine Name</label>
                  <input 
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                    placeholder="e.g. Paracetamol" 
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Composition</label>
                  <input 
                    name="composition"
                    value={formData.composition}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                    placeholder="e.g. Acetaminophen" 
                    type="text"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Ointment">Ointment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Manufacturer</label>
                    <input 
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                      placeholder="PharmaCorp" 
                      type="text"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Inventory & Batch */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-orange-700 text-sm">inventory_2</span>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Inventory & Batch</h2>
              </div>
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Batch Number</label>
                    <input 
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm font-mono" 
                      placeholder="BAT-2024-001" 
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Expiry Date</label>
                    <input 
                      required
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                      type="date"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Current Stock</label>
                    <input 
                      name="currentStock"
                      value={formData.currentStock}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                      placeholder="0" 
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Reorder Level</label>
                    <input 
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                      placeholder="50" 
                      type="number"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing & Tax */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-orange-700 text-sm">payments</span>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Pricing & Tax</h2>
              </div>
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Purchase ($)</label>
                    <input 
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                      placeholder="0.00" 
                      step="0.01" 
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Selling ($)</label>
                    <input 
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                      placeholder="0.00" 
                      step="0.01" 
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Tax (%)</label>
                    <input 
                      name="taxPercentage"
                      value={formData.taxPercentage}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                      placeholder="12" 
                      type="number"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Storage Instructions */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-orange-700 text-sm">thermostat</span>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Storage Instructions</h2>
              </div>
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Temp (°C)</label>
                    <input 
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                      placeholder="2-8°C" 
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Humidity (%)</label>
                    <input 
                      name="humidity"
                      value={formData.humidity}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm" 
                      placeholder="< 60%" 
                      type="text"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Special Notes</label>
                  <textarea 
                    name="specialNotes"
                    value={formData.specialNotes}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm resize-none" 
                    placeholder="Storage requirements or handling precautions..." 
                    rows={1}
                  ></textarea>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="pt-8 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">


            </div>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 rounded-xl bg-orange-700 font-bold text-sm text-white hover:bg-orange-800 transition-all shadow-lg shadow-orange-700/20 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">save</span>
                )}
                {loading ? 'Saving...' : 'Save Medicine'}
              </button>
            </div>
          </div>
        </form>

        <div className="bg-slate-50 py-4 px-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>VitalSync Systems</span>
          <p>© 2026 VitalSync Healthcare. All rights reserved.</p>
          <div className="flex gap-4">
            <a className="hover:text-orange-700 transition-colors" href="#">Privacy</a>
            <a className="hover:text-orange-700 transition-colors" href="#">Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMedicineModal;