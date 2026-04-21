'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import apiClient from '@/services/apiClient';
import { ApiResponse, UserResponse } from '@/types/api';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserResponse | null;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  // Extract specialization and department from memberships
  let initialSpec = '';
  let initialDept = '';
  if (user?.memberships) {
    for (const m of user.memberships) {
      if (m.specialization) initialSpec = m.specialization;
      if (m.department) initialDept = m.department;
    }
  }

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    gender: (user?.gender || 'MALE') as 'MALE' | 'FEMALE' | 'OTHER',
    dob: user?.dob ? user.dob.toString() : '',
    phone: user?.phone || '',
    active: user?.active ?? true,
    specialization: initialSpec,
    department: initialDept
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await apiClient.put<ApiResponse<UserResponse>>(`/users/${user.id}`, formData);
      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update user', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit User: ${user?.username}`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <FormField label="Full Name" required>
          <input
            className="form-input"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. John Doe"
            required
          />
        </FormField>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Gender" required>
            <select
              className="form-input"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              required
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>
          <FormField label="Date of Birth">
            <input
              type="date"
              className="form-input"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Phone Number">
          <input
            className="form-input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. +91 9876543210"
          />
        </FormField>

        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            id="user-active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="accent-[var(--primary)]"
          />
          <label htmlFor="user-active" className="text-sm font-bold text-[var(--text-primary)] cursor-pointer">
            User Account Active
          </label>
        </div>

        {(user?.roles?.includes('DOCTOR')) && (
          <div className="p-4 bg-[var(--primary-light)]/30 rounded-xl border border-[var(--primary)]/20 space-y-4">
            <h4 className="text-xs font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">stethoscope</span>
              Doctor Details
            </h4>
            <FormField label="Specialization">
              <input
                className="form-input"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Cardiology"
              />
            </FormField>
          </div>
        )}

        {(user?.roles?.includes('NURSE')) && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">medical_services</span>
              Nurse Details
            </h4>
            <FormField label="Department">
              <input
                className="form-input"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. ICU"
              />
            </FormField>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--background)] rounded-xl transition-all">Cancel</button>
          <button type="submit" className="flex-1 btn-primary">Update User</button>
        </div>
      </form>
    </Modal>
  );
};
