'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import apiClient from '@/services/apiClient';
import { ApiResponse, UserResponse, Role, CreateUserRequest, HospitalResponse } from '@/types/api';

interface UserCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isSuperMode: boolean;
  hospitals: HospitalResponse[];
  currentUserHospitalId?: number | null;
  roleOptions: Role[];
}

export const UserCreationModal: React.FC<UserCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isSuperMode,
  hospitals,
  currentUserHospitalId,
  roleOptions,
}) => {
  const [newUser, setNewUser] = useState<CreateUserRequest & { hospitalId?: number | null }>({
    username: '',
    password: '',
    roles: [] as Role[],
    fullName: '',
    gender: 'MALE',
    dob: '',
    phone: '',
    hospitalId: currentUserHospitalId ?? null
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.roles.length === 0) {
      alert('Please select at least one role');
      return;
    }
    try {
      const response = await apiClient.post<ApiResponse<UserResponse>>('/users', newUser);
      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to create user', error);
    }
  };

  const handleRoleToggle = (role: Role) => {
    setNewUser(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User"
    >
      <form onSubmit={handleCreateUser} className="p-6 space-y-4">
        {isSuperMode && !newUser.roles.includes('SUPER_ADMIN') && (
          <FormField label="Assign Hospital" required>
            <select
              className="form-input"
              value={newUser.hospitalId || ''}
              onChange={(e) => setNewUser({ ...newUser, hospitalId: e.target.value ? Number.parseInt(e.target.value) : null })}
              required
            >
              <option value="">Select a Hospital</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
              ))}
            </select>
          </FormField>
        )}

        {isSuperMode && newUser.roles.includes('SUPER_ADMIN') && (
          <div className="p-3 bg-[var(--primary-light)] rounded-lg border border-[var(--primary)] mb-4">
            <p className="text-xs font-bold text-[var(--primary)] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              Super Admins are granted Global Access by default.
            </p>
          </div>
        )}

        <FormField label="Full Name" required>
          <input
            className="form-input"
            value={newUser.fullName}
            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
            placeholder="e.g. John Doe"
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Gender" required>
            <select
              className="form-input"
              value={newUser.gender}
              onChange={(e) => setNewUser({ ...newUser, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
              required
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>
          <FormField label="Date of Birth" required>
            <input
              type="date"
              className="form-input"
              value={newUser.dob}
              onChange={(e) => setNewUser({ ...newUser, dob: e.target.value })}
              required
            />
          </FormField>
        </div>
        <FormField label="Phone Number">
          <input
            className="form-input"
            value={newUser.phone}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            placeholder="e.g. +91 9876543210"
          />
        </FormField>
        <FormField label="Username" required>
          <input
            className="form-input"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            placeholder="e.g. doctor.smith"
            required
          />
        </FormField>
        <FormField label="Temporary Password" required>
          <input
            type="password"
            className="form-input"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="••••••••"
            required
          />
        </FormField>
        <FormField label="User Roles" required>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {roleOptions.map(role => (
              <label key={role} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--background)] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={newUser.roles.includes(role)}
                  onChange={() => handleRoleToggle(role)}
                  className="accent-[var(--primary)]"
                />
                <span className="text-xs font-bold text-[var(--text-primary)]">{role}</span>
              </label>
            ))}
          </div>
        </FormField>
        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--background)] rounded-xl transition-all">Cancel</button>
          <button type="submit" className="flex-1 btn-primary">Create User</button>
        </div>
      </form>
    </Modal>
  );
};
