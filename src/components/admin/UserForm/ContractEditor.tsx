'use client';

import React, { useState } from 'react';
import { HospitalMembershipDTO, HospitalResponse, UserRequestDTO, RoleAssignmentDTO, ScheduleDTO } from '@/types/api';

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
  newContract, setNewContract, hospitals, formData, editingContractIndex, validationErrors, onCancel, onConfirm
}) => {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [activeDay, setActiveDay] = useState(1); // 1-7 (Mon-Sun)
  const [showCopyUI, setShowCopyUI] = useState<number | null>(null); // raIdx
  const [copyTargets, setCopyTargets] = useState<number[]>([]);

  const handleUpdateSchedule = (raIdx: number, newSchedules: ScheduleDTO[]) => {
    const updatedAssignments = [...(newContract.roleAssignments || [])];
    updatedAssignments[raIdx].schedules = newSchedules;
    setNewContract({ ...newContract, roleAssignments: updatedAssignments });
  };

  const addSlot = (raIdx: number) => {
    const schedules = [...(newContract.roleAssignments?.[raIdx].schedules || [])];
    schedules.push({ dayOfWeek: activeDay, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 15, maxPatients: 20 });
    handleUpdateSchedule(raIdx, schedules);
  };

  const handleCopySchedule = (raIdx: number) => {
    if (copyTargets.length === 0) return;
    const currentDaySlots = (newContract.roleAssignments?.[raIdx].schedules || []).filter(s => s.dayOfWeek === activeDay);
    let updatedSchedules = (newContract.roleAssignments?.[raIdx].schedules || []).filter(s => !copyTargets.includes(s.dayOfWeek));
    
    copyTargets.forEach(targetDay => {
      currentDaySlots.forEach(slot => {
        updatedSchedules.push({ ...slot, dayOfWeek: targetDay, id: undefined });
      });
    });

    handleUpdateSchedule(raIdx, updatedSchedules);
    setShowCopyUI(null);
    setCopyTargets([]);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black">Assign Hospital & Roles</h3>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold border border-gray-200 text-xs">Cancel</button>
          <button type="button" onClick={onConfirm} className="bg-primary-container text-white px-5 py-2 rounded-lg font-bold text-xs">Confirm</button>
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <label className="block text-[10px] font-black text-gray-700 uppercase mb-4">Facility & Roles</label>
          <select className="form-input mb-4" value={newContract.hospitalId} onChange={(e) => setNewContract({ ...newContract, hospitalId: e.target.value })} disabled={editingContractIndex !== null}>
            <option value="">Select Facility...</option>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            {['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'ADMIN'].map(role => {
              const isSelected = !!newContract.roleAssignments?.find(r => r.roleCode === role);
              return (
                <button key={role} type="button" onClick={() => {
                  const assignments = [...(newContract.roleAssignments || [])];
                  if (isSelected) setNewContract({ ...newContract, roleAssignments: assignments.filter(r => r.roleCode !== role) });
                  else setNewContract({ ...newContract, roleAssignments: [...assignments, { roleCode: role, departmentName: 'General', active: true, assignmentId: '', doctorDetails: role === 'DOCTOR' ? { consultationFee: 0 } : undefined } as any] });
                }} className={`px-3 py-1.5 rounded-lg border-2 font-black text-[9px] uppercase tracking-widest ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-400'}`}>{role}</button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6">
          {(newContract.roleAssignments || []).map((ra, raIdx) => (
            <div key={ra.roleCode} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-2">
                <span className="material-symbols-outlined text-sm text-primary">settings</span>
                <span className="text-[10px] font-black text-primary uppercase">{ra.roleCode} CONFIGURATION</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input type="text" className="form-input" placeholder="Department..." value={ra.departmentName} onChange={(e) => {
                  const updated = [...(newContract.roleAssignments || [])];
                  updated[raIdx].departmentName = e.target.value;
                  setNewContract({ ...newContract, roleAssignments: updated });
                }} />
                {ra.roleCode === 'DOCTOR' && <input type="number" className="form-input" placeholder="Consultation Fee ($)" value={ra.doctorDetails?.consultationFee} onChange={(e) => {
                  const updated = [...(newContract.roleAssignments || [])];
                  updated[raIdx].doctorDetails = { ...ra.doctorDetails!, consultationFee: Number(e.target.value) };
                  setNewContract({ ...newContract, roleAssignments: updated });
                }} />}
              </div>

              {(ra.roleCode === 'DOCTOR' || ra.roleCode === 'NURSE') && (
                <div className="space-y-4">
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                    {dayNames.map((day, idx) => {
                      const dayNum = idx + 1;
                      const count = ra.schedules?.filter(s => s.dayOfWeek === dayNum).length || 0;
                      return (
                        <button key={day} type="button" onClick={() => setActiveDay(dayNum)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeDay === dayNum ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                          {day.substring(0, 3)} {count > 0 && `(${count})`}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Daily Slots ({dayNames[activeDay-1]})</span>
                      <div className="flex gap-4">
                        <button type="button" onClick={() => setShowCopyUI(showCopyUI === raIdx ? null : raIdx)} className="text-slate-400 text-[9px] font-black uppercase flex items-center gap-1 hover:text-primary">
                          <span className="material-symbols-outlined text-xs">content_copy</span> Copy to...
                        </button>
                        <button type="button" onClick={() => addSlot(raIdx)} className="text-primary text-[9px] font-black uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">add</span> Add Slot
                        </button>
                      </div>
                    </div>

                    {showCopyUI === raIdx && (
                      <div className="p-4 bg-white rounded-xl border-2 border-primary/20 mb-4 animate-in zoom-in-95">
                        <p className="text-[10px] font-black text-primary uppercase mb-3 tracking-widest">Select target days to copy {dayNames[activeDay-1]} slots:</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {dayNames.map((day, idx) => {
                            const dayNum = idx + 1;
                            if (dayNum === activeDay) return null;
                            const isSelected = copyTargets.includes(dayNum);
                            return (
                              <button
                                key={day} type="button"
                                onClick={() => setCopyTargets(prev => isSelected ? prev.filter(d => d !== dayNum) : [...prev, dayNum])}
                                className={`px-3 py-1.5 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-primary border-primary text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                              >
                                {day.substring(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleCopySchedule(raIdx)} disabled={copyTargets.length === 0} className="flex-1 bg-primary text-white text-[9px] font-black uppercase py-2 rounded-lg disabled:opacity-50">Confirm Copy</button>
                          <button type="button" onClick={() => setShowCopyUI(null)} className="flex-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase py-2 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    )}

                    {ra.schedules?.filter(s => s.dayOfWeek === activeDay).map((slot, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 group">
                        <input type="time" className="form-input py-1 text-[10px] h-8" value={slot.startTime} onChange={(e) => {
                          const schedules = [...(ra.schedules || [])];
                          const realIdx = ra.schedules!.indexOf(slot);
                          schedules[realIdx] = { ...slot, startTime: e.target.value };
                          handleUpdateSchedule(raIdx, schedules);
                        }} />
                        <span className="text-slate-300">→</span>
                        <input type="time" className="form-input py-1 text-[10px] h-8" value={slot.endTime} onChange={(e) => {
                          const schedules = [...(ra.schedules || [])];
                          const realIdx = ra.schedules!.indexOf(slot);
                          schedules[realIdx] = { ...slot, endTime: e.target.value };
                          handleUpdateSchedule(raIdx, schedules);
                        }} />
                        <input type="number" className="form-input py-1 text-[10px] h-8 w-20" placeholder="Max Pts" value={slot.maxPatients} onChange={(e) => {
                          const schedules = [...(ra.schedules || [])];
                          const realIdx = ra.schedules!.indexOf(slot);
                          schedules[realIdx] = { ...slot, maxPatients: Number(e.target.value) };
                          handleUpdateSchedule(raIdx, schedules);
                        }} />
                        <button type="button" onClick={() => handleUpdateSchedule(raIdx, ra.schedules!.filter(s => s !== slot))} className="text-slate-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                      </div>
                    ))}
                    {(!ra.schedules || ra.schedules.filter(s => s.dayOfWeek === activeDay).length === 0) && <p className="text-[10px] text-slate-400 italic text-center py-4">No slots defined for this day.</p>}
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
