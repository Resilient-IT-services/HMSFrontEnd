'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import MedicineAutocomplete from '@/modules/pharmacy/components/MedicineAutocomplete';
import { MedicineResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';

export const StockReturnsPage = () => {
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
  const [returnQty, setReturnQty] = useState('');
  const [reason, setReason] = useState('Damaged');

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine || !returnQty) return;

    setLoading(true);
    try {
      const response = await pharmacyApi.processReturn({
        saleItemId: selectedMedicine.id,
        quantity: Number(returnQty),
        reason: reason
      });
      
      if (response.success) {
        triggerGlobalToast(`Returned ${returnQty} units of ${selectedMedicine.name} (Stock updated)`, 'success');
        setSelectedMedicine(null);
        setReturnQty('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Stock Returns">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-2xl font-black text-slate-800">Return to Inventory</h2>
            <p className="text-slate-500 mt-1 font-medium">Process returns from patients, wards, or expired stock removal.</p>
          </div>

          <form onSubmit={handleReturn} className="p-10 space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Select Medicine</label>
                <MedicineAutocomplete 
                  onSelect={setSelectedMedicine}
                  placeholder="Search medicine to return..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all shadow-inner"
                />
                {selectedMedicine && (
                  <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-900">{selectedMedicine.name}</p>
                      <p className="text-[10px] text-red-700 font-black uppercase">{selectedMedicine.batchNumber} • Exp: {selectedMedicine.expiryDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-red-700 font-black uppercase">Current Stock</p>
                      <p className="text-lg font-black text-red-900">{selectedMedicine.currentStock} Units</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Return Quantity</label>
                  <input 
                    required
                    type="number"
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value)}
                    placeholder="0"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Reason for Return</label>
                  <select 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-4 focus:ring-red-500/10 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Damaged">Damaged / Broken Seal</option>
                    <option value="Expired">Expired Stock</option>
                    <option value="Patient Return">Patient Return (Unused)</option>
                    <option value="Wrong Dispense">Incorrect Dispensing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Additional Notes</label>
                <textarea 
                  placeholder="Provide more context for this return..."
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none shadow-inner"
                ></textarea>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !selectedMedicine}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              {loading ? 'Processing Return...' : 'Complete Return Transaction'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default StockReturnsPage;
