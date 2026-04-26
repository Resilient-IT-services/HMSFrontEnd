'use client';

import React from 'react';
import { HospitalMembershipDTO, HospitalResponse, UserRequestDTO, RoleAssignmentDTO } from '@/types/api';

interface ContractEditorProps {
  newContract: HospitalMembershipDTO;
  setNewContract: (data: HospitalMembershipDTO) => void;
  hospitals: HospitalResponse[];
  formData: UserRequestDTO;
  editingContractIndex: number | null;
  validationErrors: Record<string, string>;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ContractEditor: React.FC<ContractEditorProps> = ({
  newContract,
  setNewContract,
  hospitals,
  formData,
  editingContractIndex,
  validationErrors,
  onCancel,
  onConfirm
}) => {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const localTimeToString = (lt?: any): string => {
    if (!lt) return '09:00';
    const h = lt.hour?.toString().padStart(2, '0') || '00';
    const m = lt.minute?.toString().padStart(2, '0') || '00';
    return `${h}:${m}`;
  };

  const stringToLocalTime = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return { hour: h, minute: m, second: 0, nano: 0 };
  };

  const handleAddRole = (role: string) => {
    const assignments = newContract.roleAssignments || [];
    const exists = assignments.find(r => r.roleCode === role);
    if (exists) {
      setNewContract({ ...newContract, roleAssignments: assignments.filter(r => r.roleCode !== role) });
    } else {
      const assignment: RoleAssignmentDTO = { roleCode: role, departmentName: 'General', active: true, assignmentId: '' };
      if (role === 'DOCTOR') assignment.doctorDetails = { consultationFee: 0, commissionValue: 0, visitingConsultant: false } as any;
      if (role === 'NURSE') assignment.nurseDetails = { floorLocation: '', shiftType: 'DAY' } as any;
      if (role === 'RECEPTIONIST') assignment.receptionistDetails = { deskLocation: '', emergencyContactNumber: '' } as any;
      if (role === 'ADMIN') assignment.adminDetails = { officeLocation: 'Standard', departmentHead: false } as any;
      setNewContract({ ...newContract, roleAssignments: [...assignments, assignment] });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center space-x-2 text-gray-500 text-[11px] font-bold uppercase tracking-widest">
            <span>Contracts</span> <span className="material-symbols-outlined text-sm">chevron_right</span> <span className="text-primary">New Assignment</span>
          </nav>
          <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black">Assign Hospital & Roles</h3>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-bold border border-gray-200 text-xs">Cancel</button>
          <button type="button" onClick={onConfirm} className="bg-primary-container text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:opacity-95 transition-all shadow-sm text-xs">
            <span className="material-symbols-outlined text-lg">check_circle</span> Confirm Contract
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-gray-50/50 border border-gray-200 rounded-xl p-6">
          <label className="block text-[10px] font-black text-gray-700 uppercase mb-4">Select Facility <span className="text-primary">*</span></label>
          <div className="relative">
            <select 
              className={`form-input pl-10 ${validationErrors.newContractHospital ? 'border-error ring-1 ring-error/20' : ''}`}
              value={newContract.hospitalId}
              onChange={(e) => setNewContract({ ...newContract, hospitalId: e.target.value })}
              disabled={editingContractIndex !== null}
            >
              <option value="">Select a hospital...</option>
              {hospitals
                .filter(h => editingContractIndex !== null || !formData.memberships?.some(m => String(m.hospitalId) === String(h.id)))
                .map(h => <option key={h.id} value={h.id}>{h.name}</option>)
              }
            </select>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">apartment</span>
          </div>
        </section>

        <section className="bg-gray-50/50 border border-gray-200 rounded-xl p-6">
          <label className="block text-[10px] font-black text-gray-700 uppercase mb-4">Roles at Facility <span className="text-primary">*</span></label>
          <div className="flex flex-wrap gap-3">
            {['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'ADMIN'].map(role => {
              const isSelected = !!(newContract.roleAssignments || []).find(r => r.roleCode === role);
              return (
                <button
                  key={role} type="button"
                  onClick={() => handleAddRole(role)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all font-black text-[10px] tracking-widest ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-primary'}`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(newContract.roleAssignments || []).map((ra, raIdx) => (
            <div key={ra.roleCode} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <p className="text-[10px] font-black text-primary uppercase mb-4 tracking-tighter border-b border-gray-50 pb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">settings</span> {ra.roleCode} Configuration</span>
              </p>
              <div className="mb-4">
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Assigned Department</label>
                <input type="text" className="form-input py-1.5" value={ra.departmentName} onChange={(e) => {
                  const updated = [...(newContract.roleAssignments || [])];
                  updated[raIdx].departmentName = e.target.value;
                  setNewContract({ ...newContract, roleAssignments: updated });
                }} />
              </div>
              {ra.roleCode === 'DOCTOR' && ra.doctorDetails && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Consultation Fee ($)</label>
                    <input type="number" className="form-input py-1.5" value={ra.doctorDetails.consultationFee} onChange={(e) => {
                      const updated = [...(newContract.roleAssignments || [])];
                      updated[raIdx].doctorDetails = { ...ra.doctorDetails!, consultationFee: Number(e.target.value) };
                      setNewContract({ ...newContract, roleAssignments: updated });
                    }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Commission %</label>
                      <input type="number" className="form-input py-1.5" value={ra.doctorDetails.commissionValue} onChange={(e) => {
                        const updated = [...(newContract.roleAssignments || [])];
                        updated[raIdx].doctorDetails = { ...ra.doctorDetails!, commissionValue: Number(e.target.value) };
                        setNewContract({ ...newContract, roleAssignments: updated });
                      }} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Status</label>
                      <select className="form-input py-1.5" value={ra.doctorDetails.visitingConsultant ? 'V' : 'F'} onChange={(e) => {
                        const updated = [...(newContract.roleAssignments || [])];
                        updated[raIdx].doctorDetails = { ...ra.doctorDetails!, visitingConsultant: e.target.value === 'V' };
                        setNewContract({ ...newContract, roleAssignments: updated });
                      }}><option value="F">Full-time</option><option value="V">Visiting</option></select>
                    </div>
                  </div>
                </div>
              )}
              {(ra.roleCode === 'DOCTOR' || ra.roleCode === 'NURSE') && (
                <div className="mt-6 pt-6 border-t border-gray-50 space-y-6">
                  <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-sm">calendar_month</span> Schedule</h5>
                  <div className="space-y-3">
                    {dayNames.map((day, dIdx) => {
                      const dayNum = dIdx + 1;
                      const existing = ra.schedules?.find(s => s.dayOfWeek === dayNum);
                      return (
                        <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <input type="checkbox" className="w-4 h-4 accent-primary" checked={!!existing} onChange={(e) => {
                              const updatedAssignments = [...(newContract.roleAssignments || [])];
                              let schedules = [...(updatedAssignments[raIdx].schedules || [])];
                              if (e.target.checked) schedules.push({ dayOfWeek: dayNum, startTime: { hour: 9, minute: 0 }, endTime: { hour: 17, minute: 0 }, slotDurationMinutes: 15, maxPatients: 20 });
                              else schedules = schedules.filter(s => s.dayOfWeek !== dayNum);
                              updatedAssignments[raIdx].schedules = schedules;
                              setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                            }}/><span className="text-[11px] font-bold text-slate-700">{day.substring(0, 3)}</span>
                          </div>
                          {existing && (
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <input type="time" className="form-input py-1 text-[10px] h-8" value={localTimeToString(existing.startTime)} onChange={(e) => {
                                const updatedAssignments = [...(newContract.roleAssignments || [])];
                                const schedules = [...(updatedAssignments[raIdx].schedules || [])];
                                const sIdx = schedules.findIndex(s => s.dayOfWeek === dayNum);
                                schedules[sIdx] = { ...schedules[sIdx], startTime: stringToLocalTime(e.target.value) };
                                updatedAssignments[raIdx].schedules = schedules;
                                setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                              }}/>
                              <input type="time" className="form-input py-1 text-[10px] h-8" value={localTimeToString(existing.endTime)} onChange={(e) => {
                                const updatedAssignments = [...(newContract.roleAssignments || [])];
                                const schedules = [...(updatedAssignments[raIdx].schedules || [])];
                                const sIdx = schedules.findIndex(s => s.dayOfWeek === dayNum);
                                schedules[sIdx] = { ...schedules[sIdx], endTime: stringToLocalTime(e.target.value) };
                                updatedAssignments[raIdx].schedules = schedules;
                                setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                              }}/>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
