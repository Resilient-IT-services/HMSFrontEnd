'use client';

import React from 'react';
import { UserRequestDTO } from '@/types/api';

import { Section } from '@/components/ui/Section';

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
      return <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{validationErrors[field]}</p>;
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
        <Section 
          title="Doctor Specialization" 
          icon="stethoscope" 
          iconVariant="orange"
          error={!!validationErrors.specialization || !!validationErrors.licenseNumber}
        >
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">Specialization <span className="text-orange-600">*</span></label>
            <input className={`form-input ${validationErrors.specialization ? 'border-red-500' : ''}`} type="text" placeholder="e.g. Cardiology" value={formData.doctorInfo.specialization} onChange={(e) => setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, specialization: e.target.value } })} />
            {renderFieldError('specialization')}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              License No. <span className="text-orange-600">*</span>
            </label>
            <input className={`form-input ${validationErrors.licenseNumber ? 'border-red-500' : ''}`} type="text" placeholder="e.g. MC-12345" value={formData.doctorInfo.licenseNumber} onChange={(e) => setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, licenseNumber: e.target.value } })} />
            {renderFieldError('licenseNumber')}
          </div>
        </Section>
      )}

      {assignedRoles.includes('NURSE') && formData.nurseInfo && (
        <Section title="Nursing Credentials" icon="medical_services" iconVariant="blue">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">License No. <span className="text-orange-600">*</span></label>
            <input className={`form-input ${validationErrors.nursingLicenseNo ? 'border-red-500' : ''}`} type="text" placeholder="e.g. NR-98765" value={formData.nurseInfo.nursingLicenseNo} onChange={(e) => setFormData({ ...formData, nurseInfo: { ...formData.nurseInfo!, nursingLicenseNo: e.target.value } })} />
            {renderFieldError('nursingLicenseNo')}
          </div>
        </Section>
      )}

      {assignedRoles.includes('PHARMACIST') && formData.pharmacistInfo && (
        <Section title="Pharmacy Details" icon="pill" iconVariant="emerald">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">PCI Registration No. <span className="text-orange-600">*</span></label>
            <input className={`form-input ${validationErrors.pciRegNo ? 'border-red-500' : ''}`} type="text" placeholder="e.g. PCI-556677" value={formData.pharmacistInfo.pciRegNo} onChange={(e) => setFormData({ ...formData, pharmacistInfo: { ...formData.pharmacistInfo!, pciRegNo: e.target.value } })} />
            {renderFieldError('pciRegNo')}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">Qualification</label>
            <input className="form-input" type="text" placeholder="e.g. B.Pharm, M.Pharm" value={formData.pharmacistInfo.qualification} onChange={(e) => setFormData({ ...formData, pharmacistInfo: { ...formData.pharmacistInfo!, qualification: e.target.value } })} />
          </div>
        </Section>
      )}

      {assignedRoles.includes('RECEPTIONIST') && formData.receptionistInfo && (
        <Section title="Receptionist Profile" icon="support_agent" iconVariant="purple">
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-orange-600"
              checked={formData.receptionistInfo.insuranceSpecialist}
              onChange={(e) => setFormData({ ...formData, receptionistInfo: { ...formData.receptionistInfo!, insuranceSpecialist: e.target.checked } })}
            />
            <div>
              <p className="font-bold text-sm text-on-surface uppercase">Insurance Specialist</p>
              <p className="text-[10px] text-gray-500">Check if user is trained in medical insurance processing.</p>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
};
    </div>
  );
};
