import React from 'react';
import { PatientResponse } from '@/types/api';

interface PatientInfoCardProps {
  patient: PatientResponse;
  doctorName?: string;
  prescriptionDate?: string;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patient, doctorName, prescriptionDate }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
          <span className="material-symbols-outlined text-3xl">person</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div>
            <p className="text-label-sm text-gray-400 uppercase tracking-wider text-xs font-semibold">Patient Name</p>
            <p className="font-headline-sm text-on-surface text-lg font-bold">{patient.fullName}</p>
          </div>
          <div>
            <p className="text-label-sm text-gray-400 uppercase tracking-wider text-xs font-semibold">Patient ID</p>
            <p className="font-headline-sm text-on-surface text-lg font-bold">{patient.patientCode || patient.id}</p>
          </div>
          <div>
            <p className="text-label-sm text-gray-400 uppercase tracking-wider text-xs font-semibold">Age / Gender</p>
            <p className="font-headline-sm text-on-surface text-lg font-bold">
              {patient.dob ? `${new Date().getFullYear() - new Date(patient.dob).getFullYear()} Y` : 'N/A'} / {patient.gender}
            </p>
          </div>
          <div>
            <p className="text-label-sm text-gray-400 uppercase tracking-wider text-xs font-semibold">Referring Doctor</p>
            <p className="font-headline-sm text-on-surface text-lg font-bold">{doctorName || 'N/A'}</p>
          </div>
        </div>
      </div>
      <div className="text-right hidden md:block">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-label-sm">
          <span className="w-2 h-2 rounded-full bg-green-600"></span>
          Active Session
        </div>
        <p className="text-body-sm text-gray-400 mt-2">Date: {prescriptionDate ? new Date(prescriptionDate).toLocaleDateString() : 'N/A'}</p>
      </div>
    </div>
  );
};

export default PatientInfoCard;
