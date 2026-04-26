'use client';

import React from 'react';
import { UserRequestDTO } from '@/types/api';

interface UserFormProfileTabProps {
  formData: UserRequestDTO;
  setFormData: (data: UserRequestDTO) => void;
  assignedRoles: string[];
  validationErrors: Record<string, string>;
}

export const UserFormProfileTab: React.FC<UserFormProfileTabProps> = ({
  formData,
  setFormData,
  assignedRoles,
  validationErrors
}) => {
  const renderFieldError = (field: string) => {
    if (validationErrors[field]) {
      return <p className="text-error text-[10px] font-bold mt-1 uppercase tracking-tight">{validationErrors[field]}</p>;
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 mb-8">
        <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black mb-2">Global Professional Profile</h3>
        <p className="text-xs text-gray-500">Automated cards based on user's active hospital roles.</p>
      </div>

      {assignedRoles.length === 0 && (
        <div className="py-20 text-center text-gray-400">
          <span className="material-symbols-outlined text-4xl mb-4">badge_critical</span>
          <p className="font-bold">No professional roles assigned.</p>
          <p className="text-sm">Assign roles in the Contracts tab to enable profile data entry.</p>
        </div>
      )}

      {assignedRoles.includes('DOCTOR') && formData.doctorInfo && (
        <div className={`bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm ${validationErrors.specialization ? 'ring-2 ring-error/50' : ''}`}>
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">stethoscope</span>
            </div>
            <h3 className="font-headline-sm text-on-surface uppercase tracking-widest text-xs font-black">Doctor Specialization</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-gray-700 uppercase">Specialization <span className="text-primary">*</span></label>
              <input className={`form-input ${validationErrors.specialization ? 'border-error' : ''}`} type="text" value={formData.doctorInfo.specialization} onChange={(e) => setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, specialization: e.target.value } })} />
              {renderFieldError('specialization')}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-gray-700 uppercase">License No.</label>
              <input className="form-input" type="text" value={formData.doctorInfo.licenseNumber} onChange={(e) => setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, licenseNumber: e.target.value } })} />
            </div>
          </div>
        </div>
      )}

      {assignedRoles.includes('NURSE') && formData.nurseInfo && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined">medical_services</span>
            </div>
            <h3 className="font-headline-sm text-on-surface uppercase tracking-widest text-xs font-black">Nursing Credentials</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-gray-700 uppercase">License No.</label>
              <input className="form-input" type="text" value={formData.nurseInfo.nursingLicenseNo} onChange={(e) => setFormData({ ...formData, nurseInfo: { ...formData.nurseInfo!, nursingLicenseNo: e.target.value } })} />
            </div>
          </div>
        </div>
      )}

      {assignedRoles.includes('PHARMACIST') && formData.pharmacistInfo && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined">pill</span>
            </div>
            <h3 className="font-headline-sm text-on-surface uppercase tracking-widest text-xs font-black">Pharmacy Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-gray-700 uppercase">PCI Registration No.</label>
              <input className="form-input" type="text" value={formData.pharmacistInfo.pciRegNo} onChange={(e) => setFormData({ ...formData, pharmacistInfo: { ...formData.pharmacistInfo!, pciRegNo: e.target.value } })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-gray-700 uppercase">Qualification</label>
              <input className="form-input" type="text" value={formData.pharmacistInfo.qualification} onChange={(e) => setFormData({ ...formData, pharmacistInfo: { ...formData.pharmacistInfo!, qualification: e.target.value } })} />
            </div>
          </div>
        </div>
      )}

      {assignedRoles.includes('RECEPTIONIST') && formData.receptionistInfo && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <h3 className="font-headline-sm text-on-surface uppercase tracking-widest text-xs font-black">Receptionist Profile</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-primary"
                checked={formData.receptionistInfo.insuranceSpecialist}
                onChange={(e) => setFormData({ ...formData, receptionistInfo: { ...formData.receptionistInfo!, insuranceSpecialist: e.target.checked } })}
              />
              <div>
                <p className="font-bold text-sm text-on-surface uppercase">Insurance Specialist</p>
                <p className="text-[10px] text-secondary">Check if user is trained in medical insurance processing.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
