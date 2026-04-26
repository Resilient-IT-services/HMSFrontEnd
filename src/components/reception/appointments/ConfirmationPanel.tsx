'use client';

import React from 'react';
import { PatientResponse, DoctorStaffResponse, SessionInfo } from '@/types/api';

interface ConfirmationPanelProps {
  patientSearch: string;
  setPatientSearch: (search: string) => void;
  searchResults: PatientResponse[];
  selectedPatient: PatientResponse | null;
  setSelectedPatient: (patient: PatientResponse | null) => void;
  selectedDoctor: DoctorStaffResponse | null;
  selectedSession: SessionInfo | null;
  notes: string;
  setNotes: (notes: string) => void;
  handleConfirm: () => void;
  submitting: boolean;
  onBack: () => void;
}

export const ConfirmationPanel: React.FC<ConfirmationPanelProps> = ({
  patientSearch,
  setPatientSearch,
  searchResults,
  selectedPatient,
  setSelectedPatient,
  selectedDoctor,
  selectedSession,
  notes,
  setNotes,
  handleConfirm,
  submitting,
  onBack
}) => {
  return (
    <section className="w-80 flex flex-col space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col h-full overflow-y-auto">
        <h3 className="font-manrope text-xl font-black text-slate-900 mb-8 tracking-tight">Confirm Visit</h3>
        <div className="space-y-8 flex-1">
          {/* Patient Search */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Search Patient Database</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person_search</span>
              <input 
                className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold" 
                placeholder="Patient Name or Phone" 
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>
            
            {searchResults.length > 0 && !selectedPatient && (
              <div className="mt-2 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xl z-50 absolute w-[calc(100%-4rem)]">
                {searchResults.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedPatient(p)}
                    className="p-4 hover:bg-orange-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3"
                  >
                     <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                        {p.fullName[0]}
                     </div>
                     <div>
                      <p className="text-xs font-bold text-slate-900">{p.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{p.phone}</p>
                     </div>
                  </div>
                ))}
              </div>
            )}

            {selectedPatient && (
              <div className="mt-4 bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-center justify-between animate-in zoom-in-95">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-sm">
                    {selectedPatient.fullName[0]}
                  </div>
                  <div className="text-xs">
                    <p className="font-black text-slate-900">{selectedPatient.fullName}</p>
                    <p className="text-[10px] text-slate-600 font-medium">{selectedPatient.phone}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-lg">cancel</span>
                </button>
              </div>
            )}
          </div>

          {/* Visit Logic Summary */}
          <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase">Consultant</span>
              <span className="text-[11px] font-black text-slate-900 truncate max-w-[120px]">{selectedDoctor?.fullName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase">Service</span>
              <span className="text-[11px] font-black text-orange-600 uppercase tracking-tighter">Out-Patient (OPD)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase">Allocation</span>
              <span className="text-[11px] font-black text-slate-900">Standard Visit</span>
            </div>
          </div>

          {/* Internal Memo */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Clinical Notes / Memo</label>
            <textarea 
              className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none min-h-[120px] font-medium" 
              placeholder="Brief reason for visit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 mt-auto space-y-4">
          <button 
            onClick={handleConfirm}
            disabled={submitting || !selectedPatient || !selectedDoctor || !selectedSession}
            className="w-full bg-slate-900 text-white font-black py-4 px-6 rounded-2xl hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-slate-900/10 disabled:opacity-30 disabled:hover:bg-slate-900"
          >
            {submitting ? 'PROCESSING...' : 'CONFIRM APPOINTMENT'}
          </button>
          <button 
            onClick={onBack}
            className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all"
          >
            Discard & Exit
          </button>
        </div>
      </div>
    </section>
  );
};
