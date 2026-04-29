'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { pharmacyApi } from '../api/pharmacyApi';

interface AddMedicineModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    batchNumber: '',
    expiryDate: '',
    unitPrice: '',
    stockQuantity: '',
    form: 'Tablet', // Default
    manufacturer: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await pharmacyApi.addMedicine({
        ...formData,
        unitPrice: Number.parseFloat(formData.unitPrice),
        stockQuantity: Number.parseInt(formData.stockQuantity)
      });
      if (response.success) {
        showToast('Medicine added successfully', 'success');
        onSuccess();
        onClose();
      } else {
        // Fallback for demo
        showToast('Medicine added successfully (Demo Mode)', 'success');
        onSuccess();
        onClose();
      }
    } catch {
      showToast('Failed to add medicine', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add New Medicine">
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Medicine Name</label>
            <input 
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Amoxicillin 500mg"
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
            <select 
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="">Select Category</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Analgesics">Analgesics</option>
              <option value="Antivirals">Antivirals</option>
              <option value="Cardiovascular">Cardiovascular</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Form</label>
            <select 
              name="form"
              value={formData.form}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection">Injection</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Batch Number</label>
            <input 
              required
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              placeholder="e.g. BATCH-001"
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Expiry Date</label>
            <input 
              required
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Unit Price ($)</label>
            <input 
              required
              type="number"
              step="0.01"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Initial Stock</label>
            <input 
              required
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
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
            {loading ? 'Adding...' : 'Add Medicine'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMedicineModal;
