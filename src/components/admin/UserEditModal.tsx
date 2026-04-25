'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { userService } from '@/services/userService';
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
  // Extract department from memberships
  let initialDept = '';
  if (user?.memberships && user.memberships.length > 0) {
    const membership = user.memberships[0];
    if (membership.roleAssignments && membership.roleAssignments.length > 0) {
      initialDept = membership.roleAssignments[0].departmentName;
    }
  }

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    gender: (user?.gender || 'MALE') as 'MALE' | 'FEMALE' | 'OTHER',
    dob: user?.dob ? user.dob.toString() : '',
    phone: user?.phone || '',
    active: user?.active ?? true,
    department: initialDept
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await userService.updateUser(user.id, {
        ...formData,
        username: user.username,
        superuser: user.superuser,
        memberships: user.memberships
      });
      if (response.success) {
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

        <FormField label="Email Address">
          <input
            type="email"
            className="form-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. john.doe@example.com"
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

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--background)] rounded-xl transition-all">Cancel</button>
          <button type="submit" className="flex-1 btn-primary">Update User</button>
        </div>
      </form>
    </Modal>
  );
};
