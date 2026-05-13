'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { pharmacyApi } from '../api/pharmacyApi';

interface AddInventoryItemModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddInventoryItemModal: React.FC<AddInventoryItemModalProps> = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Consumables',
    unit: 'pcs'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (!formData.unit.trim()) newErrors.unit = 'Unit is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const response = await pharmacyApi.defineInventoryItem(formData);
      if (response.success) {
        showToast('Inventory item defined successfully', 'success');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Define New Inventory Item">
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
          <input 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Syringe, Cotton, Gloves"
            className={`w-full px-4 py-2 border rounded-xl focus:ring-2 outline-none ${errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1 font-bold uppercase">{errors.name}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
          <select 
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="Consumables">Consumables</option>
            <option value="Surgical">Surgical</option>
            <option value="Lab Supplies">Lab Supplies</option>
            <option value="General">General</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Unit of Measure</label>
          <input 
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            placeholder="e.g. pcs, box, pkt"
            className={`w-full px-4 py-2 border rounded-xl focus:ring-2 outline-none ${errors.unit ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
          />
          {errors.unit && <p className="text-xs text-red-500 mt-1 font-bold uppercase">{errors.unit}</p>}
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
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Defining...' : 'Define Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddInventoryItemModal;
