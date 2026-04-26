'use client';

import React from 'react';
import { UserFullProfileDTO } from '@/types/api';
import { useUserFormLogic } from './UserForm/useUserFormLogic';
import { UserFormPersonalTab } from './UserForm/UserFormPersonalTab';
import { UserFormContractsTab } from './UserForm/UserFormContractsTab';
import { UserFormProfileTab } from './UserForm/UserFormProfileTab';

interface UserFormProps {
  initialData?: UserFullProfileDTO;
  isEdit?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, isEdit }) => {
  const logic = useUserFormLogic(initialData, isEdit);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const steps = [
    { id: 1, name: 'Personal Info', icon: 'person' },
    { id: 2, name: 'Contacts Info', icon: 'contact_page' },
    { id: 3, name: 'Profile Info', icon: 'badge' },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center text-primary text-2xl font-bold border-4 border-orange-100">
            {logic.formData.fullName ? getInitials(logic.formData.fullName) : '?'}
          </div>
          <div>
            <h1 className="font-headline-xl text-on-surface">{isEdit ? 'Edit User Profile' : 'Create New User'}</h1>
            <p className="font-body-lg text-gray-500">{logic.formData.fullName || 'New Staff Member'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${logic.currentStep >= step.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {logic.currentStep > step.id ? <span className="material-symbols-outlined text-sm">check</span> : step.id}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest hidden lg:block ${logic.currentStep === step.id ? 'text-primary' : 'text-gray-400'}`}>{step.name}</span>
                    {step.id < 3 && <div className={`w-8 h-px ${logic.currentStep > step.id ? 'bg-primary' : 'bg-gray-200'}`}></div>}
                </div>
            ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-8 min-h-[400px]">
          {logic.currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <UserFormPersonalTab formData={logic.formData} setFormData={logic.setFormData} isEdit={isEdit} validationErrors={logic.validationErrors} />
            </div>
          )}
          
          {logic.currentStep === 2 && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                        <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black">Contact Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="font-label-sm text-gray-700 uppercase">Email Address <span className="text-primary">*</span></label>
                            <input 
                                className={`form-input ${logic.validationErrors.email ? 'border-error' : ''}`} 
                                type="email" 
                                placeholder="e.g. jane.doe@vitalsync.com"
                                value={logic.formData.email} 
                                onChange={(e) => logic.setFormData({ ...logic.formData, email: e.target.value })} 
                            />
                            {logic.validationErrors.email && <p className="text-error text-[10px] font-bold mt-1 uppercase tracking-tight">{logic.validationErrors.email}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="font-label-sm text-gray-700 uppercase">Primary Phone <span className="text-primary">*</span></label>
                            <input 
                                className={`form-input ${logic.validationErrors.phone ? 'border-error' : ''}`} 
                                type="tel" 
                                placeholder="e.g. +1 (555) 000-0000"
                                value={logic.formData.phone} 
                                onChange={(e) => logic.setFormData({ ...logic.formData, phone: e.target.value })} 
                            />
                            {logic.validationErrors.phone && <p className="text-error text-[10px] font-bold mt-1 uppercase tracking-tight">{logic.validationErrors.phone}</p>}
                        </div>
                    </div>
                    <div className="mt-12 p-8 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div>
                            <p className="text-sm font-bold text-blue-900">Communication Preferences</p>
                            <p className="text-xs text-blue-700 mt-1">These contact details will be used for system notifications and hospital communications. Ensure they are accurate before proceeding to professional profile setup.</p>
                        </div>
                    </div>
                </div>
             </div>
          )}
          
          {logic.currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12">
                <UserFormContractsTab 
                  formData={logic.formData} setFormData={logic.setFormData} hospitals={logic.hospitals} 
                  validationErrors={logic.validationErrors} isAddingContract={logic.isAddingContract} setIsAddingContract={logic.setIsAddingContract}
                  editingContractIndex={logic.editingContractIndex} setEditingContractIndex={logic.setEditingContractIndex}
                  newContract={logic.newContract} setNewContract={logic.setNewContract} confirmAddContract={logic.confirmAddContract} duplicateContract={logic.duplicateContract}
                />
                
                <UserFormProfileTab formData={logic.formData} setFormData={logic.setFormData} assignedRoles={logic.assignedRoles} validationErrors={logic.validationErrors} />
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 right-0 left-64 bg-white/95 backdrop-blur-md border-t border-gray-200 px-8 py-4 flex justify-between items-center z-40">
        <button type="button" onClick={() => logic.router.back()} className="text-gray-400 hover:text-gray-600 font-bold text-sm uppercase tracking-widest transition-colors">Discard</button>
        <div className="flex gap-3">
          {logic.currentStep > 1 && (
            <button type="button" onClick={logic.prevStep} className="btn-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </button>
          )}
          {logic.currentStep < 3 ? (
            <button type="button" onClick={logic.nextStep} className="btn-primary flex items-center gap-2">
              Save & Next
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          ) : (
            <button type="button" onClick={() => logic.handleSubmit()} disabled={logic.loading} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {logic.loading ? 'Creating...' : (isEdit ? 'Update Profile' : 'Finalize & Create')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserForm;
