'use client';

import React, { useState } from 'react';
import { HospitalMembershipDTO, HospitalResponse, ScheduleDTO } from '@/types/api';
import { MobileSelector } from '@/components/ui/MobileSelector';
import { DAY_OF_WEEK_OPTIONS } from '@/utils/enumOptions';

interface ContractEditorProps {
  newContract: HospitalMembershipDTO;
  setNewContract: (data: HospitalMembershipDTO) => void;
  hospitals: HospitalResponse[];
  departments: string[];
  editingContractIndex: number | null;
  validationErrors: Record<string, string>;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ContractEditor: React.FC<ContractEditorProps> = ({
  newContract, setNewContract, hospitals, departments, editingContractIndex, validationErrors, onCancel, onConfirm
}) => {
  const dayValues = DAY_OF_WEEK_OPTIONS.map((option) => option.value);
  const [activeDay, setActiveDay] = useState<typeof dayValues[number]>('MONDAY');
  const [showCopyUI, setShowCopyUI] = useState<number | null>(null); // raIdx
  const [copyTargets, setCopyTargets] = useState<Array<typeof dayValues[number]>>([]);

  const selectedHospital = hospitals.find(h => String(h.id) === String(newContract.hospitalId));
  const availableDepartments = React.useMemo(() => {
    const hospDepts = selectedHospital?.departments || [];
    // Merge with global departments, unique
    return [...new Set([...departments, ...hospDepts])]
  .filter(dept => dept !== 'Cardiology');
  }, [departments, selectedHospital]);

  const handleUpdateSchedule = (raIdx: number, newSchedules: ScheduleDTO[]) => {
    const updatedAssignments = [...(newContract.roleAssignments || [])];
    updatedAssignments[raIdx] = { ...updatedAssignments[raIdx], schedules: newSchedules };
    setNewContract({ ...newContract, roleAssignments: updatedAssignments });
  };

  const addSlot = (raIdx: number) => {
    const schedules = [...(newContract.roleAssignments?.[raIdx].schedules || []), { dayOfWeek: activeDay, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 15, maxPatients: 20 }];
    handleUpdateSchedule(raIdx, schedules);
  };

  const handleCopySchedule = (raIdx: number) => {
    if (copyTargets.length === 0) return;
    const currentDaySlots = (newContract.roleAssignments?.[raIdx].schedules || []).filter(s => s.dayOfWeek === activeDay);
    const updatedSchedules = (newContract.roleAssignments?.[raIdx].schedules || []).filter(s => !copyTargets.includes(s.dayOfWeek));
    
    for (const targetDay of copyTargets) {
      for (const slot of currentDaySlots) {
        updatedSchedules.push({ ...slot, dayOfWeek: targetDay, id: undefined });
      }
    }

    handleUpdateSchedule(raIdx, updatedSchedules);
    setShowCopyUI(null);
    setCopyTargets([]);
  };

  const renderFieldError = (field: string) => {
    if (validationErrors[field]) {
      return <p className="text-error text-[10px] font-bold mt-1 uppercase tracking-tight">{validationErrors[field]}</p>;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-[10px] md:text-xs font-black">Assign Hospital & Roles</h3>
        <div className="flex gap-2 md:gap-3">
          <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold border border-gray-200 text-[10px] md:text-xs">Cancel</button>
          <button type="button" onClick={onConfirm} className="flex-1 md:flex-none bg-primary-container text-white px-5 py-2 rounded-lg font-bold text-[10px] md:text-xs">Confirm</button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <section className={`bg-gray-50 border ${validationErrors.contractHospital || validationErrors.contractRoles ? 'border-error ring-1 ring-error/10' : 'border-gray-200'} rounded-xl p-4 md:p-6`}>
          <label className="block text-[10px] font-black text-gray-700 uppercase mb-3 md:mb-4">Facility & Roles <span className="text-primary">*</span></label>
          <MobileSelector
            label="Facility"
            options={hospitals.map(h => ({ id: h.id, name: h.name, icon: 'location_city' }))}
            value={newContract.hospitalId || ''}
            onChange={(val) => setNewContract({ ...newContract, hospitalId: val })}
            placeholder="Select Facility..."
            disabled={editingContractIndex !== null}
            error={validationErrors.contractHospital}
            className="mb-4"
          />
          {renderFieldError('contractHospital')}
          
          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-4">
            {['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'ADMIN'].map(role => {
              const isSelected = !!newContract.roleAssignments?.find(r => r.roleCode === role);
              return (
                <button key={role} type="button" onClick={() => {
                  const assignments = [...(newContract.roleAssignments || [])];
                  if (isSelected) setNewContract({ ...newContract, roleAssignments: assignments.filter(r => r.roleCode !== role) });
                  else setNewContract({ ...newContract, roleAssignments: [...assignments, { 
                    roleCode: role,
                    departments: [], 
                    active: true, 
                    assignmentId: '', 
                    doctorDetails: role === 'DOCTOR' ? { consultationFee: 500, followUpDays: 0 } : undefined 
                  } as any] });
                }} className={`px-2 md:px-3 py-1.5 rounded-lg border-2 font-black text-[8px] md:text-[9px] uppercase tracking-widest transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-400'}`}>{role}</button>
              );
            })}
          </div>
          {renderFieldError('contractRoles')}
        </section>

        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {(newContract.roleAssignments || []).map((ra, raIdx) => {
            const departmentsErrorKey = `departments_${ra.roleCode}`;
            const feeErrorKey = `fee_${ra.roleCode}`;

            return (
            <div key={ra.roleCode} className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-gray-50 pb-2">
                <span className="material-symbols-outlined text-xs md:text-sm text-primary">settings</span>
                <span className="text-[10px] font-black text-primary uppercase">{ra.roleCode} CONFIGURATION</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-6 mb-4 md:mb-6">
                {/* Department Selection */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="font-label-sm text-gray-700 uppercase">Hospital Departments <span className="text-primary">*</span></label>
                  <div className={`flex flex-wrap gap-2 p-3 bg-gray-50/50 border rounded-xl min-h-[50px] ${validationErrors[departmentsErrorKey] ? 'border-error ring-1 ring-error/10' : 'border-gray-200'}`}>
                    {availableDepartments.map(dept => {
                      const isDeptSelected = ra.departments?.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            const updated = [...(newContract.roleAssignments || [])];
                            const currentDepts = ra.departments || [];
                            updated[raIdx] = { 
                              ...updated[raIdx], 
                              departments: isDeptSelected 
                                ? currentDepts.filter(d => d !== dept) 
                                : [...currentDepts, dept] 
                            };
                            setNewContract({ ...newContract, roleAssignments: updated });
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tighter transition-all ${
                            isDeptSelected 
                              ? 'bg-primary border-primary text-white shadow-sm' 
                              : 'bg-white border-gray-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {dept}
                        </button>
                      );
                    })}
                    {availableDepartments.length === 0 && <p className="text-[10px] text-slate-400 italic font-medium">No departments available in catalog.</p>}
                  </div>
                  {renderFieldError(departmentsErrorKey)}
                </div>

                {ra.roleCode === 'DOCTOR' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Consultation Fee (₹) <span className="text-primary">*</span></label>
                      <input type="number" min="500" step="1" className={`form-input ${validationErrors[feeErrorKey] ? 'border-error ring-1 ring-error/20' : ''}`} placeholder="e.g. 500" value={ra.doctorDetails?.consultationFee} onChange={(e) => {
                        let value = e.target.value;
                        value = value.replaceAll(/[^0-9]/g, '');
                        const val = value === '' ? 0 : Number(value);
                        const updated = [...(newContract.roleAssignments || [])];
                        updated[raIdx] = {
                          ...updated[raIdx],
                          doctorDetails: {
                          ...ra.doctorDetails!,
                          consultationFee: val
                          }
                        };
                        setNewContract({ ...newContract, roleAssignments: updated });
                      }}
                      />
                      {renderFieldError(feeErrorKey)}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Follow-up Days <span className="text-primary">*</span></label>
                      <input type="number" min="0" step="1" className="form-input" value={ra.doctorDetails?.followUpDays ?? 0} onChange={(e) => {
                        let value = e.target.value;
                        value = value.replaceAll(/\D/g, '');
                        const updated = [...(newContract.roleAssignments || [])];
                        updated[raIdx] = {
                          ...updated[raIdx],
                          doctorDetails: { ...ra.doctorDetails!, followUpDays: value === '' ? 0 : Number(value) }
                        };
                        setNewContract({...newContract, roleAssignments: updated});
                      }}
                      />
                    </div>
                  </>
                )}
              </div>

              {(ra.roleCode === 'DOCTOR' || ra.roleCode === 'NURSE') && (
                <div className="space-y-4">
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto scrollbar-hide">
                    {DAY_OF_WEEK_OPTIONS.map((option) => {
                      const day = option.value;
                      const count = ra.schedules?.filter(s => s.dayOfWeek === day).length || 0;
                      return (
                        <button key={day} type="button" onClick={() => setActiveDay(day)} className={`flex-1 min-w-[50px] py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeDay === day ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                          {option.label.slice(0, 3)} {count > 0 && `(${count})`}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="space-y-3 p-3 md:p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Daily Slots ({activeDay})</span>
                      <div className="flex gap-3 md:gap-4">
                        <button type="button" onClick={() => setShowCopyUI(showCopyUI === raIdx ? null : raIdx)} className="text-slate-400 text-[8px] md:text-[9px] font-black uppercase flex items-center gap-1 hover:text-primary">
                          <span className="material-symbols-outlined text-xs">content_copy</span> <span className="hidden md:inline">Copy to...</span>
                        </button>
                        <button type="button" onClick={() => addSlot(raIdx)} className="text-primary text-[8px] md:text-[9px] font-black uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">add</span> Add Slot
                        </button>
                      </div>
                    </div>

                    {showCopyUI === raIdx && (
                      <div className="p-3 md:p-4 bg-white rounded-xl border-2 border-primary/20 mb-4 animate-in zoom-in-95">
                        <p className="text-[10px] font-black text-primary uppercase mb-3 tracking-widest">Select target days to copy {activeDay} slots:</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {DAY_OF_WEEK_OPTIONS.map((option) => {
                            const day = option.value;
                            if (day === activeDay) return null;
                            const isSelected = copyTargets.includes(day);
                            return (
                              <button
                                key={day} type="button"
                                onClick={() => setCopyTargets(prev => isSelected ? prev.filter(d => d !== day) : [...prev, day])}
                                className={`px-2 md:px-3 py-1.5 rounded-lg border-2 text-[8px] md:text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-primary border-primary text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                              >
                                {option.label.slice(0, 3)}
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

                    <div className="space-y-3">
                      {ra.schedules?.filter(s => s.dayOfWeek === activeDay).map((slot, sIdx) => (
                        <div key={sIdx} className="flex flex-wrap items-center gap-2 md:gap-3 bg-white p-3 rounded-lg border border-slate-200 group">
                          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                            <input type="time" className="form-input py-1 px-2 text-[10px] h-8 flex-1" value={slot.startTime} onChange={(e) => {
                              const schedules = [...(ra.schedules || [])];
                              const realIdx = ra.schedules!.indexOf(slot);
                              schedules[realIdx] = { ...slot, startTime: e.target.value };
                              handleUpdateSchedule(raIdx, schedules);
                            }} />
                            <span className="text-slate-300">→</span>
                            <input type="time" className="form-input py-1 px-2 text-[10px] h-8 flex-1" value={slot.endTime} onChange={(e) => {
                              const schedules = [...(ra.schedules || [])];
                              const realIdx = ra.schedules!.indexOf(slot);
                              schedules[realIdx] = { ...slot, endTime: e.target.value };
                              handleUpdateSchedule(raIdx, schedules);
                            }} />
                          </div>
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <input type="number" className="form-input py-1 px-2 text-[10px] h-8 flex-1 md:w-20" placeholder="Max Pts" value={slot.maxPatients} onChange={(e) => {
                              const schedules = [...(ra.schedules || [])];
                              const realIdx = ra.schedules!.indexOf(slot);
                              schedules[realIdx] = { ...slot, maxPatients: Number(e.target.value) };
                              handleUpdateSchedule(raIdx, schedules);
                            }} />
                            <button type="button" onClick={() => handleUpdateSchedule(raIdx, ra.schedules!.filter(s => s !== slot))} className="text-slate-300 hover:text-red-500 transition-colors p-1"><span className="material-symbols-outlined text-base md:text-sm">delete</span></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(!ra.schedules || ra.schedules.filter(s => s.dayOfWeek === activeDay).length === 0) && <p className="text-[10px] text-slate-400 italic text-center py-4">No slots defined for this day.</p>}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
