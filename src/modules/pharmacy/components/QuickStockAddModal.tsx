// QuickStockAddModal.tsx
// Updated Clean UI Version

'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { pharmacyApi } from '../api/pharmacyApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { INDIAN_STATES } from '@/utils/enumOptions';
import { formatCurrency } from '@/utils/formatters';

interface QuickStockAddModalProps {
  medicineId: string;
  medicineName: string;
  currentStock?: number;
  taxPercentage?: number;
  hsnCode?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const QuickStockAddModal: React.FC<QuickStockAddModalProps> = ({
  medicineId,
  medicineName,
  currentStock = 0,
  taxPercentage = 12,
  hsnCode: masterHsnCode = '',
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    batchNumber: '',
    expiryDate: '',
    manufacturingDate: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    reorderLevel: '',
    hsnCode: masterHsnCode,
    supplier: '',
    supplierState: '',
    taxInclusive: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({
      ...formData,
      [name]: val
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const purchasePrice = Number(formData.purchasePrice);
    const sellingPrice = Number(formData.sellingPrice);

    if (purchasePrice <= 0) {
      triggerGlobalToast('Purchase price must be greater than zero', 'error');
      return;
    }
    if (sellingPrice <= 0) {
      triggerGlobalToast('Selling price must be greater than zero', 'error');
      return;
    }
    if (sellingPrice < purchasePrice) {
      triggerGlobalToast('Selling price cannot be less than purchase price', 'error');
      return;
    }

    try {
      setLoading(true);

      const response = await pharmacyApi.addStock({
        medicineId,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate || undefined,
        manufacturingDate: formData.manufacturingDate || undefined,
        quantity: Number(formData.quantity),
        purchasePrice,
        sellingPrice,
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : undefined,
        hsnCode: formData.hsnCode || undefined,
        supplier: formData.supplier || undefined,
        supplierState: formData.supplierState || undefined,
        taxInclusive: formData.taxInclusive,
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
      size="2xl"
    >
      <div className="bg-white">
        {/* Medicine Info */}
        <div className="px-8 pt-8">
          <div className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                {medicineName}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  ID: {medicineId.split('-')[0]}
                </p>
                {formData.hsnCode && (
                  <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase">
                    HSN: {formData.hsnCode}
                  </span>
                )}
              </div>
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
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

            {/* HSN Code */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">HSN Code</label>
              <input
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleChange}
                placeholder="e.g. 3004"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Manufacturing Date */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Mfg Date</label>
              <input
                type="date"
                name="manufacturingDate"
                value={formData.manufacturingDate}
                onChange={handleChange}
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

            {/* Supplier Name */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Supplier Name</label>
              <input
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g. ABC Pharma"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Supplier State */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Supplier State</label>
              <select
                name="supplierState"
                value={formData.supplierState}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
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

            {/* Reorder Level */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Low Stock Label (Units)</label>
              <input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleChange}
                placeholder="e.g. 50"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
              />
            </div>

            {/* Pricing Section */}
            <div className="md:col-span-2 grid grid-cols-2 gap-6">
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

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Retail Price (₹)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-2 ml-1">
              <input 
                type="checkbox"
                id="taxInclusive-quick"
                name="taxInclusive"
                checked={formData.taxInclusive}
                onChange={handleChange}
                className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 transition-all"
              />
              <label htmlFor="taxInclusive-quick" className="text-xs font-black uppercase text-slate-700 cursor-pointer">
                Purchase Price is Tax Inclusive
              </label>
              <p className="text-[10px] text-slate-400 font-medium ml-2">
                (System will back-calculate the taxable amount)
              </p>
            </div>

            {/* Tax Preview Section */}
            {(formData.purchasePrice && Number(formData.purchasePrice) > 0) && (
              <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taxation Preview</h4>
                  <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase">
                    {formData.taxInclusive ? 'Tax Inclusive' : 'Tax Exclusive'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Base Taxable</p>
                    <p className="text-sm font-black text-slate-700">
                      {(() => {
                        const total = Number(formData.purchasePrice);
                        const rate = taxPercentage;
                        if (formData.taxInclusive) {
                          return formatCurrency(total / (1 + (rate / 100)));
                        }
                        return formatCurrency(total);
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Est. Tax (Total)</p>
                    <p className="text-sm font-black text-slate-700">
                      {(() => {
                        const total = Number(formData.purchasePrice);
                        const rate = taxPercentage;
                        if (formData.taxInclusive) {
                          const base = total / (1 + (rate / 100));
                          return formatCurrency(total - base);
                        }
                        return formatCurrency(total * (rate / 100));
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
