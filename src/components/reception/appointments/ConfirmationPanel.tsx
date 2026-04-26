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
    <section className="w-[320px] bg-white border-l border-slate-200 flex flex-col shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-hidden">
      <div className="p-6 space-y-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Patient Selection */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 font-headline-sm">Patient Selection</h2>
          <div className="space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                className="w-full bg-slate-50 border-none rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-600/20 font-medium" 
                placeholder="Search by name or phone..." 
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
                      <p className="text-sm font-bold text-slate-900">{p.fullName}</p>
                      <p className="text-[11px] text-slate-500">{p.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Add New Patient
            </button>
          </div>
        </div>

        {/* Patient Card */}
        {selectedPatient ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-primary text-xs font-bold hover:underline">Change</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Full Name</p>
                <p className="text-sm font-bold text-slate-900">{selectedPatient.fullName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Age</p>
                  <p className="text-sm font-bold text-slate-900">28 Years</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Gender</p>
                  <p className="text-sm font-bold text-slate-900">Female</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Phone</p>
                <p className="text-sm font-bold text-slate-900">{selectedPatient.phone}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select a patient to continue</p>
          </div>
        )}

        {/* Notes Section */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Visit Notes</label>
          <textarea 
            className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-600/20 transition-all resize-none h-24 outline-none font-medium" 
            placeholder="Reason for visit..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>

        {/* Confirmation Panel */}
        <div className="mt-auto bg-slate-50 -mx-6 -mb-6 p-6 border-t border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Summary</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">Physician</p>
              <p className="text-sm font-bold text-slate-900">{selectedDoctor?.fullName || 'Not selected'}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">Date & Time</p>
              <p className="text-sm font-bold text-slate-900">
                {selectedSession ? `${selectedSession.startTime} (Suggested)` : 'No slot selected'}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">Consultation Fee</p>
              <p className="text-sm font-bold text-slate-900">$120.00</p>
            </div>
          </div>
          <button 
            disabled={submitting || !selectedPatient || !selectedDoctor || !selectedSession}
            onClick={handleConfirm}
            className="w-full py-4 bg-primary-container text-white text-base font-bold rounded-xl shadow-lg shadow-orange-600/20 hover:bg-primary transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {submitting ? 'Confirming...' : 'Confirm Appointment'}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-4">By confirming, you agree to our <a className="underline" href="#">Terms of Service</a></p>
        </div>
      </div>
    </section>
  );
};
