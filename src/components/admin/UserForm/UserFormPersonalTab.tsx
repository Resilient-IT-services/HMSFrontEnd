'use client';

import React from 'react';
import { UserRequestDTO } from '@/types/api';

interface UserFormPersonalTabProps {
  formData: UserRequestDTO;
  setFormData: (data: UserRequestDTO) => void;
  isEdit?: boolean;
  validationErrors: Record<string, string>;
}

export const UserFormPersonalTab: React.FC<UserFormPersonalTabProps> = ({
  formData,
  setFormData,
  isEdit,
  validationErrors
}) => {
  const renderFieldError = (field: string) => {
    if (validationErrors[field]) {
      return <p className="text-error text-[10px] font-bold mt-1 uppercase tracking-tight">{validationErrors[field]}</p>;
    }
    return null;
  };

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
          <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black">Global Identity</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">Full Name <span className="text-primary">*</span></label>
            <input 
              className={`form-input ${validationErrors.fullName ? 'border-error ring-1 ring-error/20' : ''}`}
              type="text" 
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            {renderFieldError('fullName')}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">Username <span className="text-primary">*</span></label>
            <input 
              className={`form-input ${validationErrors.username ? 'border-error ring-1 ring-error/20' : ''}`}
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isEdit}
            />
            {renderFieldError('username')}
          </div>
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-gray-700 uppercase">Password <span className="text-primary">*</span></label>
              <input 
                className={`form-input ${validationErrors.password ? 'border-error ring-1 ring-error/20' : ''}`}
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {renderFieldError('password')}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">Email Address <span className="text-primary">*</span></label>
            <input className={`form-input ${validationErrors.email ? 'border-error' : ''}`} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            {renderFieldError('email')}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">Primary Phone <span className="text-primary">*</span></label>
            <input className={`form-input ${validationErrors.phone ? 'border-error' : ''}`} type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            {renderFieldError('phone')}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">Date of Birth <span className="text-primary">*</span></label>
            <input 
              className={`form-input ${validationErrors.dob ? 'border-error ring-1 ring-error/20' : ''}`}
              type="date" 
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            {renderFieldError('dob')}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">Gender Identity</label>
            <select className="form-input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-primary"
                checked={formData.superuser}
                onChange={(e) => setFormData({ ...formData, superuser: e.target.checked })}
              />
              <div>
                <p className="font-bold text-sm text-on-surface">System Administrator Privileges</p>
                <p className="text-xs text-secondary">Grant this user full access to global system settings across all hospitals.</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
