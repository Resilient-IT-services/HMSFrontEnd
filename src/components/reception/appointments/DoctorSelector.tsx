'use client';

import React from 'react';
import { DoctorStaffResponse } from '@/types/api';

interface DoctorSelectorProps {
  doctors: DoctorStaffResponse[];
  selectedDoctor: DoctorStaffResponse | null;
  onSelectDoctor: (doctor: DoctorStaffResponse) => void;
  loading: boolean;
}

export const DoctorSelector: React.FC<DoctorSelectorProps> = ({ 
  doctors, 
  selectedDoctor, 
  onSelectDoctor, 
  loading 
}) => {
  return (
    <section className="w-[280px] flex flex-col shrink-0">
      <div className="mb-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">person_search</span>
          <input 
            className="w-full border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
            placeholder="Search doctor..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {doctors.map((doc) => (
          <div 
            key={doc.id}
            onClick={() => onSelectDoctor(doc)}
            className={`${
              selectedDoctor?.id === doc.id 
                ? 'bg-orange-50/50 border border-primary' 
                : 'bg-white border border-slate-200 hover:border-primary/40 hover:bg-slate-50'
            } p-3 rounded-custom cursor-pointer transition-all`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                selectedDoctor?.id === doc.id ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'
              }`}>
                {doc.fullName[0]}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${selectedDoctor?.id === doc.id ? 'text-slate-900' : 'text-slate-700'}`}>
                  {doc.fullName}
                </p>
                <p className="text-[12px] text-slate-500">{doc.specialization}</p>
              </div>
              <div className={`w-2 h-2 rounded-full ${true ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`}></div>
            </div>
          </div>
        ))}
        {doctors.length === 0 && !loading && (
          <p className="text-center text-xs text-slate-400 py-12 italic">No doctors found.</p>
        )}
      </div>
    </section>
  );
};
