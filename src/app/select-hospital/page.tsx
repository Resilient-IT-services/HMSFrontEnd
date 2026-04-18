'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { authService } from '@/services/authService';
import { setUser } from '@/state/authSlice';
import { Card } from '@/components/ui/Card';

const SelectHospitalPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSelect = async (hospitalId: number) => {
    try {
      const response = await authService.selectHospital(hospitalId);
      if (response.success && response.data) {
        dispatch(setUser(response.data));
      }
    } catch (error) {
      console.error('Failed to select hospital', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 text-center">Select Hospital</h1>
        <p className="text-[var(--text-secondary)] mb-8 text-center">Please choose a facility to continue</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {user?.hospitals.map((h) => (
            <div 
              key={h.hospital_id}
              onClick={() => handleSelect(h.hospital_id)}
              className="cursor-pointer group"
            >
              <Card className="hover:border-[var(--primary)] transition-all h-full">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-4 group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-3xl">apartment</span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{h.hospital_name}</h3>
                  <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">{h.hospital_code}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-1">
                    {h.roles.map(r => (
                      <span key={r} className="px-2 py-0.5 bg-[var(--background)] text-[var(--text-secondary)] text-[10px] font-bold rounded">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectHospitalPage;
