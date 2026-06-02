'use client';

import React, { useState } from 'react';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { laboratoryApi } from '@/services/laboratoryService';
import { LaboratoryTestDTO } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface AddLaboratoryTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddLaboratoryTestModal: React.FC<AddLaboratoryTestModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LaboratoryTestDTO>({
    testCode: '',
    testName: '',
    shortName: '',
    aliasName: '',
    hsnCode: '',
    sacCode: '9993', // Default SAC for medical services
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.testCode?.trim()) newErrors.testCode = 'Test Code is required';
    if (!formData.testName?.trim()) newErrors.testName = 'Test Name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      const response = await laboratoryApi.createTest(formData);
      if (response.success) {
        triggerGlobalToast('Laboratory test created successfully', 'success');
        onSuccess();
        onClose();
      } else if (response.error) {
         triggerGlobalToast(response.error.message || 'Failed to create test', 'error');
      }
    } catch (error: any) {
      console.error('Failed to create laboratory test', error);
      const msg = error.response?.data?.error?.message || 'Failed to create laboratory test';
      triggerGlobalToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Laboratory Test"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">Test Code *</label>
            <input 
              name="testCode"
              value={formData.testCode}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium ${errors.testCode ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="e.g. CBC001" 
              type="text"
            />
            {errors.testCode && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.testCode}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">Test Name *</label>
            <input 
              name="testName"
              value={formData.testName}
              onChange={handleChange}
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium ${errors.testName ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="e.g. Complete Blood Count" 
              type="text"
            />
            {errors.testName && <p className="text-[10px] font-bold text-red-500 uppercase mt-1 ml-1">{errors.testName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">HSN Code</label>
              <input 
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium" 
                placeholder="e.g. 3822" 
                type="text"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">SAC Code</label>
              <input 
                name="sacCode"
                value={formData.sacCode}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium" 
                placeholder="e.g. 9993" 
                type="text"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">Short Name</label>
              <input 
                name="shortName"
                value={formData.shortName}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium" 
                placeholder="e.g. CBC" 
                type="text"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">Alias Name</label>
              <input 
                name="aliasName"
                value={formData.aliasName}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium" 
                placeholder="e.g. Hemogram" 
                type="text"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Save Laboratory Test
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddLaboratoryTestModal;
