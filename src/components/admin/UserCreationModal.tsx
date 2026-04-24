'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import apiClient from '@/services/apiClient';
import { ApiResponse, UserResponse, Role, UserRequestDTO, HospitalResponse } from '@/types/api';

interface CreateUserRequest extends UserRequestDTO {
  roles: Role[];
  hospitalId?: string | null;
  specialization?: string;
  department?: string;
  consultationFee?: number;
  followUpDays?: number;
}

export const UserCreationModal = ({
                                    isOpen,
                                    onClose,
                                    onSuccess,
                                    isSuperMode,
                                    hospitals,
                                    currentUserHospitalId,
                                    roleOptions,
                                  }: any) => {

  const [newUser, setNewUser] = useState<CreateUserRequest>({
    username: '',
    password: '',
    roles: [],
    fullName: '',
    gender: 'MALE',
    dob: '',
    phone: '',
    hospitalId: currentUserHospitalId ?? null,
    specialization: '',
    department: ''
  });

  const [errors, setErrors] = useState<any>({});
  const [apiError, setApiError] = useState('');


  const validate = () => {
    const err: any = {};

    if (!newUser.fullName.trim()) err.fullName = "Full name is required";

    if (!newUser.username.trim()) err.username = "Username is required";
    else if (newUser.username.length < 4) err.username = "Min 4 characters required";

    if (!newUser.password) err.password = "Password required";
    else if (newUser.password.length < 6) err.password = "Min 6 characters";

    if (!newUser.dob) err.dob = "Date of birth required";

    if (newUser.phone && !/^[0-9]{10}$/.test(newUser.phone)) {
      err.phone = "Enter valid 10 digit number";
    }

    if (newUser.roles.length === 0) {
      err.roles = "Select at least one role";
    }

    if (isSuperMode && !newUser.roles.includes('SUPER_ADMIN')) {
      if (!newUser.hospitalId) {
        err.hospitalId = "Hospital required";
      }
    }

    if (newUser.roles.includes('DOCTOR') && !newUser.specialization) {
      err.specialization = "Specialization required";
    }

    if (newUser.roles.includes('NURSE') && !newUser.department) {
      err.department = "Department required";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };


  const handleCreateUser = async (e: any) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setApiError('');

      const res = await apiClient.post('/users', newUser);

      if (res.data.success) {

        const createdUser = res.data.data;


        console.log("ROLES:", newUser.roles);

        if (newUser.roles.includes('DOCTOR')) {
          console.log("DOCTOR BLOCK ENTERED ");

          await apiClient.post('/doctors', {
            userId: createdUser.id,
            specialization: newUser.specialization,
            consultationFee: newUser.consultationFee,
            followUpDays: newUser.followUpDays
          });

          console.log("DOCTOR API CALLED ");
        }

        onSuccess();
        onClose();
      }

    } catch (err: any) {
      setApiError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleChange = (field: string, value: any) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
    setErrors((prev: any) => ({ ...prev, [field]: '' }));
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
      <Modal isOpen={isOpen} onClose={onClose} title="Create New User">

        <form onSubmit={handleCreateUser} className="p-6 space-y-4">

          {/* 🔴 API ERROR */}
          {apiError && <div className="text-red-500 text-sm">{apiError}</div>}

          {/* HOSPITAL */}
          {isSuperMode && !newUser.roles.includes('SUPER_ADMIN') && (
              <FormField label="Assign Hospital" required>
                <select
                    className={`form-input ${errors.hospitalId ? 'border-red-500' : ''}`}
                    value={newUser.hospitalId || ''}
                    onChange={(e) => handleChange('hospitalId', e.target.value || null)}
                >
                  <option value="">Select a Hospital</option>
                  {hospitals.map((h: HospitalResponse) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                {errors.hospitalId && <p className="text-red-500 text-xs">{errors.hospitalId}</p>}
              </FormField>
          )}

          {/* FULL NAME */}
          <FormField label="Full Name" required>
            <input className="form-input"
                   value={newUser.fullName}
                   onChange={(e) => handleChange('fullName', e.target.value)}
            />
            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
          </FormField>

          {/* USERNAME */}
          <FormField label="Username" required>
            <input className="form-input"
                   value={newUser.username}
                   onChange={(e) => handleChange('username', e.target.value)}
            />
            {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
          </FormField>

          {/* PASSWORD */}
          <FormField label="Password" required>
            <input type="password" className="form-input"
                   value={newUser.password}
                   onChange={(e) => handleChange('password', e.target.value)}
            />
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
          </FormField>

          {/* DOB */}
          <FormField label="DOB" required>
            <input type="date" className="form-input"
                   value={newUser.dob}
                   onChange={(e) => handleChange('dob', e.target.value)}
            />
            {errors.dob && <p className="text-red-500 text-xs">{errors.dob}</p>}
          </FormField>

          {/* PHONE */}
          <FormField label="Phone">
            <input className="form-input"
                   value={newUser.phone}
                   onChange={(e) => handleChange('phone', e.target.value)}
            />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
          </FormField>

          {/* ROLES */}
          <FormField label="Roles" required>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((role: Role) => (
                  <label key={role}>
                    <input
                        type="checkbox"
                        checked={newUser.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                    />
                    {role}
                  </label>
              ))}
            </div>
            {errors.roles && <p className="text-red-500 text-xs">{errors.roles}</p>}
          </FormField>

          {/* DOCTOR */}
          {newUser.roles.includes('DOCTOR') && (
              <div className="p-4 bg-[var(--primary-light)]/30 rounded-xl border border-[var(--primary)]/20 space-y-4">

                <h4 className="text-xs font-bold">Doctor Details</h4>

                {/* Specialization */}
                <FormField label="Specialization" required>
                  <input
                      className="form-input"
                      value={newUser.specialization}
                      onChange={(e) =>
                          setNewUser({ ...newUser, specialization: e.target.value })
                      }
                      required
                  />
                </FormField>


                <FormField label="Consultation Fee" required>
                  <input
                      type="number"
                      className="form-input"
                      value={newUser.consultationFee ?? ''}
                      onChange={(e) =>
                          setNewUser({ ...newUser, consultationFee: Number(e.target.value) })
                      }
                      placeholder="e.g. 500"
                      required
                  />
                </FormField>


                <FormField label="Follow-up Days" required>
                  <input
                      type="number"
                      className="form-input"
                      value={newUser.followUpDays ?? ''}
                      onChange={(e) =>
                          setNewUser({ ...newUser, followUpDays: Number(e.target.value) })
                      }
                      placeholder="e.g. 7"
                      required
                  />
                </FormField>

              </div>
          )}

          {/* NURSE */}
          {newUser.roles.includes('NURSE') && (
              <FormField label="Department" required>
                <input className="form-input"
                       value={newUser.department}
                       onChange={(e) => handleChange('department', e.target.value)}
                />
                {errors.department && <p className="text-red-500 text-xs">{errors.department}</p>}
              </FormField>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>

        </form>
      </Modal>
  );
};