'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { userService } from '@/services/userService';
import { ApiResponse, UserResponse, Role, HospitalResponse, HospitalMembershipDTO, RoleAssignmentDTO } from '@/types/api';

interface RoleAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedUser: UserResponse | null;
  hospitals: HospitalResponse[];
  roleOptions: Role[];
}

export const RoleAllocationModal: React.FC<RoleAllocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedUser,
  hospitals,
  roleOptions,
}) => {
  const [allocation, setAllocation] = useState<{
    hospitalId: string | null;
    roles: Role[];
    department: string;
  }>(() => {
    if (selectedUser?.memberships && selectedUser.memberships.length > 0) {
      const membership = selectedUser.memberships[0];
      return {
        hospitalId: membership.hospitalId,
        roles: membership.roleAssignments.map(ra => ra.roleCode as Role),
        department: membership.roleAssignments[0]?.departmentName || ''
      };
    }
    return { hospitalId: '', roles: [], department: '' };
  });

  const handleAllocateRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !allocation.hospitalId) return;

    try {
      const roleAssignments: RoleAssignmentDTO[] = allocation.roles.map(role => ({
        assignmentId: '', // Server will handle
        roleCode: role,
        departmentName: allocation.department || 'General',
        active: true
      }));

      const newMembership: HospitalMembershipDTO = {
        hospitalId: allocation.hospitalId,
        roleAssignments
      };

      // Merge or Update memberships
      const existingMemberships = selectedUser.memberships || [];
      const updatedMemberships = existingMemberships.some(m => m.hospitalId === allocation.hospitalId)
        ? existingMemberships.map(m => m.hospitalId === allocation.hospitalId ? newMembership : m)
        : [...existingMemberships, newMembership];

      const response = await userService.updateUser(selectedUser.id, {
        username: selectedUser.username,
        email: selectedUser.email,
        fullName: selectedUser.fullName,
        gender: selectedUser.gender,
        dob: selectedUser.dob,
        phone: selectedUser.phone,
        superuser: selectedUser.superuser,
        memberships: updatedMemberships
      });

      if (response.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to allocate roles', error);
    }
  };

  const handleAllocationRoleToggle = (role: Role) => {
    setAllocation(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const hasAccess = (hospId: string) => {
    return selectedUser?.memberships?.some(m => m.hospitalId === hospId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Allocate Roles: ${selectedUser?.username}`}
    >
      <form onSubmit={handleAllocateRoles} className="p-6 space-y-4">
        <FormField label="Target Context" required>
          <select
            className="form-input"
            value={allocation.hospitalId || ''}
            onChange={(e) => {
              const hospId = e.target.value;
              const existing = selectedUser?.memberships?.find(m => m.hospitalId === hospId);
              setAllocation({
                hospitalId: hospId,
                roles: existing ? existing.roleAssignments.map(ra => ra.roleCode as Role) : [],
                department: existing?.roleAssignments[0]?.departmentName || ''
              });
            }}
          >
            <option value="" disabled>Select a Hospital</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>
                {hasAccess(h.id) ? '✓ ' : ''}{h.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Department" required>
          <input
            className="form-input"
            value={allocation.department}
            onChange={(e) => setAllocation(prev => ({ ...prev, department: e.target.value }))}
            placeholder="e.g. Cardiology"
          />
        </FormField>

        <div className="space-y-2">
          <p className="text-label-md font-label-md text-on-surface uppercase tracking-widest text-[11px] mb-3">Roles to Allocate</p>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.filter(r => r !== 'SUPER_ADMIN').map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleAllocationRoleToggle(role)}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                  allocation.roles.includes(role)
                    ? 'bg-primary-container text-on-primary border-primary'
                    : 'bg-surface-bright text-secondary border-outline-variant hover:border-primary'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {allocation.roles.includes(role) ? 'check_circle' : 'circle'}
                </span>
                <span className="text-xs font-bold">{role}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!allocation.hospitalId || allocation.roles.length === 0}
          >
            Apply Allocation
          </button>
        </div>
      </form>
    </Modal>
  );
};
