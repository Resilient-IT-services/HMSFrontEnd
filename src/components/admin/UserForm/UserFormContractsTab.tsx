'use client';

import React from 'react';
import { UserRequestDTO, HospitalResponse, HospitalMembershipDTO, RoleAssignmentDTO } from '@/types/api';
import { ContractEditor } from './ContractEditor';

interface UserFormContractsTabProps {
  formData: UserRequestDTO;
  setFormData: (data: UserRequestDTO) => void;
  hospitals: HospitalResponse[];
  validationErrors: Record<string, string>;
  isAddingContract: boolean;
  setIsAddingContract: (val: boolean) => void;
  editingContractIndex: number | null;
  setEditingContractIndex: (val: number | null) => void;
  newContract: HospitalMembershipDTO;
  setNewContract: (data: HospitalMembershipDTO) => void;
  confirmAddContract: () => void;
  duplicateContract: (contract: HospitalMembershipDTO) => void;
}

export const UserFormContractsTab: React.FC<UserFormContractsTabProps> = ({
  formData,
  setFormData,
  hospitals,
  validationErrors,
  isAddingContract,
  setIsAddingContract,
  editingContractIndex,
  setEditingContractIndex,
  newContract,
  setNewContract,
  confirmAddContract,
  duplicateContract
}) => {
  return (
    <div className="p-container-padding">
      {isAddingContract ? (
        <ContractEditor 
          newContract={newContract}
          setNewContract={setNewContract}
          hospitals={hospitals}
          formData={formData}
          editingContractIndex={editingContractIndex}
          validationErrors={validationErrors}
          onCancel={() => setIsAddingContract(false)}
          onConfirm={confirmAddContract}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black">Hospital Memberships</h3>
              {validationErrors.memberships && <p className="text-error text-[10px] font-bold uppercase tracking-tight">{validationErrors.memberships}</p>}
            </div>
            <button 
              type="button" 
              onClick={() => setIsAddingContract(true)}
              className="bg-primary-container text-white px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add_business</span>
              Add Contract
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.memberships?.map((m, idx) => {
              const hosp = hospitals.find(h => String(h.id) === String(m.hospitalId));
              return (
                <div key={idx} className="p-5 border border-gray-200 rounded-xl hover:border-primary-container transition-all bg-white font-body-md shadow-sm group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">location_city</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{m.hospitalName || hosp?.name || 'Hospital ID: ' + m.hospitalId}</h4>
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">
                          {(m.roleAssignments || []).map(ra => ra.roleCode).join(' • ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => duplicateContract(m)}
                        className="text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setNewContract(m);
                          setEditingContractIndex(idx);
                          setIsAddingContract(true);
                        }}
                        className="text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          const updated = [...(formData.memberships || [])];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, memberships: updated });
                        }}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(m.roleAssignments || []).map((ra, raIdx) => (
                      <div key={raIdx} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="text-[10px] font-black text-primary uppercase">{ra.roleCode}</span>
                        {ra.doctorDetails && <span className="text-[10px] font-bold">₹{ra.doctorDetails.consultationFee} Fee</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {(!formData.memberships || formData.memberships.length === 0) && (
              <div className="md:col-span-2 py-12 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-4xl text-gray-300">description</span>
                <p className="text-gray-500 font-bold">No hospital contracts found.</p>
                <button type="button" onClick={() => setIsAddingContract(true)} className="btn-secondary text-xs">Assign First Hospital</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
