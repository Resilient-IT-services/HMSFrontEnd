'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { UserFullProfileDTO } from '@/types/api';
import { useUserFormLogic } from './UserForm/useUserFormLogic';
import { UserFormPersonalTab } from './UserForm/UserFormPersonalTab';
import { UserFormContractsTab } from './UserForm/UserFormContractsTab';
import { UserFormProfileTab } from './UserForm/UserFormProfileTab';
import ChangePasswordModal from './ChangePasswordModal';

interface UserFormProps {
  initialData?: UserFullProfileDTO;
  isEdit?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, isEdit }) => {
  const logic = useUserFormLogic(initialData, isEdit);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { user: currentUser, isSuperMode } = useSelector((state: RootState) => state.auth);
  
  const isSuperUser = currentUser?.superuser || currentUser?.roles?.includes('SUPER_ADMIN') || isSuperMode;
  const canChangePassword = isEdit && logic.formData.id && isSuperUser;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <form onSubmit={logic.handleSubmit}>
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
          <div className="flex items-center gap-3">
            {canChangePassword && (
              <button 
                type="button" 
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-6 py-2.5 bg-white border-2 border-orange-200 text-orange-700 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-orange-50 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">lock_reset</span>
                CHANGE PASSWORD
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex border-b border-gray-100 bg-gray-50/30">
            {['personal', 'contracts', 'profile'].map((tab) => (
              <button 
                key={tab} type="button" onClick={() => logic.setActiveTab(tab as any)}
                className={`px-8 py-4 font-bold text-sm capitalize border-b-2 ${logic.activeTab === tab ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500'}`}
              >
                {tab} Info
              </button>
            ))}
          </div>

          <div className="p-8">
            {logic.activeTab === 'personal' && <UserFormPersonalTab formData={logic.formData} setFormData={logic.setFormData} isEdit={isEdit} validationErrors={logic.validationErrors} />}
            {logic.activeTab === 'contracts' && (
              <UserFormContractsTab 
                formData={logic.formData} setFormData={logic.setFormData} hospitals={logic.hospitals} 
                validationErrors={logic.validationErrors} isAddingContract={logic.isAddingContract} setIsAddingContract={logic.setIsAddingContract}
                editingContractIndex={logic.editingContractIndex} setEditingContractIndex={logic.setEditingContractIndex}
                newContract={logic.newContract} setNewContract={logic.setNewContract} confirmAddContract={logic.confirmAddContract} duplicateContract={logic.duplicateContract}
              />
            )}
            {logic.activeTab === 'profile' && <UserFormProfileTab formData={logic.formData} setFormData={logic.setFormData} assignedRoles={logic.assignedRoles} validationErrors={logic.validationErrors} />}
          </div>
        </div>

        <div className="fixed bottom-0 right-0 left-64 bg-white/95 backdrop-blur-md border-t border-gray-200 px-8 py-4 flex justify-end items-center z-40">
          <div className="flex gap-3">
            <button type="button" onClick={() => logic.router.back()} className="btn-secondary">Discard</button>
            <button type="submit" disabled={logic.loading} className="btn-primary">Save Changes</button>
          </div>
        </div>
      </form>

      {isEdit && logic.formData.id && (
        <ChangePasswordModal 
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          userId={logic.formData.id}
        />
      )}
    </div>
  );
};

export default UserForm;
