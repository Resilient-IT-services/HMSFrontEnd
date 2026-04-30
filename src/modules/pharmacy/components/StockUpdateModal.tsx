'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { pharmacyApi } from '../api/pharmacyApi';
import { StockTransactionType } from '@/types/api';

interface StockUpdateModalProps {
  itemId: string;
  itemName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const StockUpdateModal: React.FC<StockUpdateModalProps> = ({ itemId, itemName, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'STOCK_IN' as StockTransactionType,
    quantity: '',
    reference: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await pharmacyApi.updateStock({
        itemId,
        type: formData.type,
        quantity: Number.parseInt(formData.quantity),
        reference: formData.reference
      });
      
      if (response.success) {
        showToast('Stock updated successfully', 'success');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      // No need for toast here as apiClient handles it, 
      // but if we want custom message:
      // showToast('Failed to update stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Update Stock: ${itemName}`}>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Transaction Type</label>
          <select 
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="STOCK_IN">STOCK_IN (Adding new stock)</option>
            <option value="STOCK_OUT">STOCK_OUT (Using/Removing stock)</option>
            <option value="RETURN">RETURN (Items returned to inventory)</option>
            <option value="ADJUSTMENT">ADJUSTMENT (Correction after physical count)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
          <input 
            required
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            min="1"
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Reference / Note</label>
          <textarea 
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            placeholder="e.g. Purchase Order #123, Issued to Ward A"
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2 border rounded-xl font-bold hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockUpdateModal;
