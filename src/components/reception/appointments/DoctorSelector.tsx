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
    <section className="w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 mb-3 font-headline-sm">Select Physician</h2>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input 
            className="w-full bg-slate-50 border-none rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-orange-600/20" 
            placeholder="Search doctor by name..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto doctor-list-scrollbar p-2 space-y-1">
        {loading ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading physicians...</div>
        ) : doctors.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">No physicians found.</div>
        ) : (
          doctors.map((doc) => {
            const isSelected = selectedDoctor?.userId === doc.userId;
            return (
              <div 
                key={doc.userId}
                onClick={() => onSelectDoctor(doc)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer border ${
                  isSelected 
                    ? 'bg-orange-50 border-orange-100' 
                    : 'hover:bg-slate-50 border-transparent group'
                }`}
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isSelected ? 'bg-primary-fixed text-primary' : 'bg-slate-100 text-slate-600 group-hover:bg-white'
                  }`}>
                    {doc.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <p className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {doc.fullName}
                  </p>
                  <p className="text-[11px] text-slate-500">{doc.specialization}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
