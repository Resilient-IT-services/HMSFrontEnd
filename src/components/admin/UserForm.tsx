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

import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';

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

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'contracts', label: 'Contracts Info' },
    { id: 'profile', label: 'Profile Info' }
  ];

  const activeTabId = tabs.findIndex(t => t.id === logic.activeTab);
  const stepLabel = tabs[activeTabId].label;

  return (
    <div className="max-w-6xl mx-auto pb-32 md:pb-20 px-0 md:px-0">
      <form onSubmit={logic.handleSubmit}>
        {/* Header - Sticky on Mobile */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 md:py-6 md:px-6 flex items-center justify-between gap-4 mb-4 md:mb-8 md:static md:bg-white md:rounded-xl md:border md:shadow-sm">
          <div className="flex items-center gap-3 md:gap-6">
            <button type="button" onClick={() => logic.router.back()} className="p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors md:hidden">
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
            <Avatar 
              name={logic.formData.fullName} 
              size="md"
              className="md:hidden"
            />
            <Avatar 
              name={logic.formData.fullName} 
              size="xl" 
              className="hidden md:flex"
            />
            <div>
              <h1 className="font-bold text-lg md:text-headline-xl text-on-surface leading-tight">{isEdit ? 'Edit Profile' : 'Add New User'}</h1>
              <p className="hidden md:block font-body-md md:font-body-lg text-gray-500">{logic.formData.fullName || 'New Staff Member'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canChangePassword && (
              <button 
                type="button" 
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 md:px-6 py-2 bg-white border border-orange-200 text-orange-700 rounded-xl font-bold text-[10px] md:text-xs flex items-center justify-center gap-2 hover:bg-orange-50 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-base">lock_reset</span>
                <span className="hidden md:inline text-xs">CHANGE PASSWORD</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Indicator - Mobile Only */}
        <div className="px-4 mb-6 md:hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">STEP {activeTabId + 1} OF {tabs.length}</span>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{stepLabel}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-container transition-all duration-500 rounded-full" 
              style={{ width: `${((activeTabId + 1) / tabs.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="px-0 md:px-0">
          <Tabs 
            tabs={tabs} 
            activeTab={logic.activeTab} 
            onChange={(id) => logic.setActiveTab(id as any)}
            className="md:border md:rounded-xl"
          >
            {logic.activeTab === 'personal' && <UserFormPersonalTab formData={logic.formData} setFormData={logic.setFormData} isEdit={isEdit} validationErrors={logic.validationErrors} />}
            {logic.activeTab === 'contracts' && (
              <UserFormContractsTab 
                formData={logic.formData} setFormData={logic.setFormData} hospitals={logic.hospitals} 
                validationErrors={logic.validationErrors} isAddingContract={logic.isAddingContract} 
                openAddContract={logic.openAddContract} openEditContract={logic.openEditContract}
                setIsAddingContract={logic.setIsAddingContract}
                editingContractIndex={logic.editingContractIndex}
                newContract={logic.newContract} setNewContract={logic.setNewContract} confirmAddContract={logic.confirmAddContract} duplicateContract={logic.duplicateContract}
              />
            )}
            {logic.activeTab === 'profile' && <UserFormProfileTab formData={logic.formData} setFormData={logic.setFormData} specializations={logic.specializations} assignedRoles={logic.assignedRoles} validationErrors={logic.validationErrors} />}
          </Tabs>
        </div>

        <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-4 py-4 flex justify-end items-center z-40 md:bg-white/95">
          <div className="flex gap-3 w-full md:w-auto max-w-lg mx-auto md:mx-0">
            <button type="button" onClick={() => logic.router.back()} className="btn-secondary flex-1 md:flex-none md:h-12">Discard</button>
            <button type="submit" disabled={logic.loading} className="btn-primary flex-1 md:flex-none md:h-12 min-w-[140px]">
              <span className="material-symbols-outlined md:hidden">save</span>
              {isEdit ? 'Save Changes' : 'Create User'}
            </button>
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
