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
    <section className="w-[320px] flex flex-col shrink-0 space-y-4 h-full">
      <div className="bg-white rounded-custom border border-slate-200 p-5 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Patient Details</h3>
          <button className="text-primary text-[11px] font-bold hover:underline flex items-center">
            <span className="material-symbols-outlined text-base mr-1">add</span> Add New
          </button>
        </div>
        
        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
          <input 
            className="w-full border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none" 
            placeholder="Name or phone..." 
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
          />
          {searchResults.length > 0 && !selectedPatient && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 mt-1 max-h-60 overflow-y-auto">
              {searchResults.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPatient(p)}
                  className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                >
                  <p className="text-xs font-bold text-slate-900">{p.fullName}</p>
                  <p className="text-[10px] text-slate-500">{p.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPatient ? (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-sm">
                {selectedPatient.fullName[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{selectedPatient.fullName}</p>
                <p className="text-[11px] text-slate-500">{selectedPatient.phone}</p>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="bg-white px-2 py-0.5 rounded text-[10px] border border-slate-200 text-slate-600">32 yrs</span>
              <span className="bg-white px-2 py-0.5 rounded text-[10px] border border-slate-200 text-slate-600">Male</span>
              <span className="bg-white px-2 py-0.5 rounded text-[10px] border border-slate-200 text-slate-600">ID: #{selectedPatient.id.substring(0, 5)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-8 border border-dashed border-slate-200 mb-6 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a patient</p>
          </div>
        )}

        <div className="border-t border-slate-100 pt-5 space-y-4 flex-1">
          <h4 className="font-bold text-sm text-slate-900">Confirmation</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Physician</span>
              <span className="text-xs font-semibold text-slate-900">{selectedDoctor?.fullName || 'Not selected'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Appointment</span>
              <span className="text-xs font-semibold text-slate-900">
                {selectedSession ? `${selectedSession.startTime} – ${selectedSession.endTime}` : 'No slot selected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Visit Type</span>
              <span className="text-xs font-semibold text-slate-900">Consultation</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Visit Notes</label>
            <textarea 
              className="w-full border-slate-200 rounded-lg p-3 text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none h-20 outline-none" 
              placeholder="Add instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 space-y-3">
          <button 
            disabled={submitting || !selectedPatient || !selectedDoctor || !selectedSession}
            onClick={handleConfirm}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-[#e85a1a] active:scale-95 transition-all shadow-lg shadow-orange-500/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processing...' : 'Confirm Appointment'}
          </button>
          <button 
            onClick={onBack}
            className="w-full bg-white border border-slate-200 text-slate-500 font-bold py-2 rounded-xl hover:bg-slate-50 transition-all text-[11px]"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="bg-orange-600 rounded-custom p-4 text-white flex items-center justify-between shadow-lg shadow-orange-600/20 cursor-pointer hover:bg-orange-700 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <span className="material-symbols-outlined text-white text-xl">bolt</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-tight">Quick Action</p>
            <p className="text-sm font-bold">Priority Walk-in</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-base opacity-60">arrow_forward_ios</span>
      </div>
    </section>
  );
};
