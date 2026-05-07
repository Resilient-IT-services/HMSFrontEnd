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
          maxWidth="max-w-3xl"
      >
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">



          {/* Medicine Info */}
          <div className="px-6 pt-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {medicineName}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  ID: {medicineId.split('-')[0]}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">
                  Current Stock
                </p>

                <p className="text-lg font-semibold text-slate-800">
                  {currentStock} Units
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Batch */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Batch Number
                </label>

                <input
                    required
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleChange}
                    placeholder="Enter batch number"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expiry Date
                </label>

                <input
                    required
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity
                </label>

                <input
                    required
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Purchase Price
                </label>

                <input
                    required
                    type="number"
                    step="0.01"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Selling Price */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Selling Price
                </label>

                <input
                    required
                    type="number"
                    step="0.01"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="pt-5 border-t border-slate-200 flex items-center justify-end gap-3">

              <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>

              <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Add Stock'}
              </button>

            </div>
          </form>
        </div>
      </Modal>
  );
};

export default QuickStockAddModal;