'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import MedicineAutocomplete from '@/modules/pharmacy/components/MedicineAutocomplete';
import { MedicineResponse } from '@/types/api';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

export const BatchEntryPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
  const [formData, setFormData] = useState({
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) {
      triggerGlobalToast('Please select a medicine', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await pharmacyApi.addStock({
        medicineId: selectedMedicine.id,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate,
        quantity: Number(formData.quantity),
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
      });

      if (response.success) {
        triggerGlobalToast('Batch entered successfully', 'success');
        router.push('/pharmacy/stock');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Stock Entry (Batch-wise)">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800">New Stock Batch</h2>
            <p className="text-sm text-slate-500">Add a new batch of medicine to the inventory.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Select Medicine</label>
                <MedicineAutocomplete 
                  onSelect={(m) => {
                    setSelectedMedicine(m);
                    setFormData(prev => ({
                      ...prev,
                      purchasePrice: m.purchasePrice?.toString() || '',
                      sellingPrice: m.sellingPrice?.toString() || '',
                    }));
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
                {selectedMedicine && (
                  <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-orange-900">{selectedMedicine.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 bg-orange-100 text-[9px] font-black uppercase rounded text-orange-700">
                          {selectedMedicine.form || selectedMedicine.category || 'General'}
                        </span>
                        <p className="text-[10px] text-orange-700 font-bold uppercase">{selectedMedicine.genericName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-orange-700 font-bold uppercase">Current Stock</p>
                      <p className="text-sm font-black text-orange-900">{selectedMedicine.currentStock} Units</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Batch Number</label>
                <input 
                  required
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  placeholder="e.g. BAT-2026-X1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Expiry Date</label>
                <input 
                  required
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Quantity</label>
                <input 
                  required
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Purchase Price</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Selling Price</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
              <button 
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-700/20 hover:bg-orange-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Complete Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};
