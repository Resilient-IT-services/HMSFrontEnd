// QuickStockAddModal.tsx
// Updated Clean UI Version

'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { pharmacyApi } from '../api/pharmacyApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

interface QuickStockAddModalProps {
  medicineId: string;
  medicineName: string;
  currentStock?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const QuickStockAddModal: React.FC<QuickStockAddModalProps> = ({
  medicineId,
  medicineName,
  currentStock = 0,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await pharmacyApi.addStock({
        medicineId,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate,
        quantity: Number(formData.quantity),
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
      });

      if (response.success) {
        triggerGlobalToast('Stock added successfully', 'success');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      triggerGlobalToast('Failed to add stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add New Stock"
      size="xl"
    >
      <div className="bg-white">
        {/* Medicine Info */}
        <div className="px-8 pt-8">
          <div className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                {medicineName}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                ID: {medicineId.split('-')[0]}
              </p>
            </div>

            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Current Inventory
              </p>
              <p className="text-xl font-black text-orange-600 tracking-tighter">
                {currentStock} Units
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Batch Number</label>
              <input
                required
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="e.g. B-10293"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Expiry Date</label>
              <input
                required
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Quantity to Add</label>
              <input
                required
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Unit Cost (₹)</label>
              <input
                required
                type="number"
                step="0.01"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Selling Price */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Retail Price (₹)</label>
              <input
                required
                type="number"
                step="0.01"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Footer */}
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
              className="px-10 py-3.5 rounded-2xl bg-slate-900 font-black text-xs uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-xl shadow-orange-700/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">save</span>
              )}
              {loading ? 'Processing...' : 'Confirm Stock Intake'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default QuickStockAddModal;
