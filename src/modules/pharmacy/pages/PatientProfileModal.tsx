'use client';

import React from 'react';
import { PatientResponse } from '@/types/api';
import { Modal } from '@/components/ui/Modal';

interface PatientProfileModalProps {
  patient: PatientResponse;
  onClose: () => void;
}

const PatientProfileModal: React.FC<PatientProfileModalProps> = ({ patient, onClose }) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Patient Profile">
      <div className="space-y-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
            {patient.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{patient.fullName}</h2>
            <p className="text-[var(--text-secondary)]">Patient ID: {patient.patientCode || patient.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-t border-[var(--border)] pt-6">
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Gender</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{patient.gender}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Date of Birth</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Phone</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{patient.phone}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Registered On</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Address</p>
          <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{patient.address || 'No address provided'}</p>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg font-semibold hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PatientProfileModal;
