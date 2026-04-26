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
    <section className="w-1/3 flex flex-col space-y-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Physician</h3>
        <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded-full text-slate-600 uppercase">Available Today</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {doctors.map((doc) => (
          <div 
            key={doc.id}
            onClick={() => onSelectDoctor(doc)}
            className={`bg-white p-4 rounded-2xl border-2 transition-all cursor-pointer group ${selectedDoctor?.id === doc.id ? 'border-orange-600 shadow-md ring-4 ring-orange-600/5' : 'border-slate-100 hover:border-orange-200'}`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-colors ${selectedDoctor?.id === doc.id ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-100'}`}>
                {doc.fullName[0]}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-900">{doc.fullName}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{doc.specialization}</p>
                <div className="mt-3 flex items-center justify-between">
                   <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span className="text-[10px] font-bold text-green-600 uppercase">Available</span>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400">Next: 10:30 AM</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {doctors.length === 0 && !loading && (
          <p className="text-center text-xs text-slate-400 py-12 italic bg-white rounded-2xl border border-dashed border-slate-200">No physicians found in directory.</p>
        )}
      </div>
    </section>
  );
};
