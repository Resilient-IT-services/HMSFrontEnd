'use client';

import React from 'react';
import { PatientResponse, DoctorStaffResponse, SessionInfo } from '@/types/api';
import { getPrimarySpecialization } from '@/utils/staffDisplay';

interface ConfirmationPanelProps {
  selectedPatient: PatientResponse | null;
  selectedDoctor: DoctorStaffResponse | null;
  selectedSession: SessionInfo | null;
  editableTime: string;
  handleConfirm: () => void;
  submitting: boolean;
  selectedDate: string;
}

export const ConfirmationPanel: React.FC<ConfirmationPanelProps> = ({
  selectedPatient,
  selectedDoctor,
  selectedSession,
  editableTime,
  handleConfirm,
  submitting,
  selectedDate
}) => {
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg sticky top-20">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm">Visit Summary</h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Doctor Profile Card */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 shrink-0">
            {selectedDoctor ? (
              <span className="text-xs font-black">{selectedDoctor.fullName.split(' ').map(n => n[0]).join('')}</span>
            ) : (
              <span className="material-symbols-outlined text-xl">medical_services</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 leading-tight text-xs truncate">
              {selectedDoctor?.fullName || 'No Doctor Selected'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {selectedDoctor ? getPrimarySpecialization(selectedDoctor) : 'Select doctor first'}
            </p>
          </div>
        </div>

        {/* Visit Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Patient</span>
            <span className="font-bold text-slate-900 truncate ml-2 max-w-[120px]">{selectedPatient?.fullName || '-'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Date</span>
            <span className="font-bold text-slate-900">{formatDate(selectedDate)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Time Slot</span>
            <span className="font-bold text-slate-900">{editableTime || '-'}</span>
          </div>
          
          <div className="pt-3 mt-1 border-t border-slate-100 flex justify-between items-end">
            <div>
              <p className="text-[9px] text-slate-500 font-black mb-0.5 uppercase tracking-tighter">Est. Fee</p>
              <p className="text-[10px] text-slate-400 font-medium">Standard</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-primary">
                {selectedDoctor ? `₹${selectedDoctor.consultationFee}` : '₹0'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Tip/Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-2">
          <span className="material-symbols-outlined text-blue-500 text-base shrink-0">info</span>
          <p className="text-[10px] text-blue-700 leading-tight">
            Confirmation SMS sent immediately after approval.
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <button 
          disabled={submitting || !selectedPatient || !selectedDoctor || !selectedSession}
          onClick={handleConfirm}
          className="w-full py-3 bg-primary text-white rounded-lg font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 text-sm"
        >
          {submitting ? 'Booking...' : 'Book Appointment'}
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
