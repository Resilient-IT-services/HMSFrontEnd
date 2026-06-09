'use client';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { setCurrentHospitalId } from '@/state/authSlice';
import { hospitalService } from '@/services/hospitalService';
import { HospitalResponse } from '@/types/api';
import { cn } from '@/lib/cn';

interface HospitalSelectorProps {
  className?: string;
}

const HospitalSelector: React.FC<HospitalSelectorProps> = ({ className }) => {
  const dispatch = useDispatch();
  const { user, isSuperMode } = useSelector((state: RootState) => state.auth);
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);

  // Logic to highlight if hospital context is missing when on hospital-specific pages
  const pathname = globalThis.window === undefined ? '' : globalThis.location.pathname;
  const needsContext = pathname.includes('/lab/') || 
                       pathname.includes('/settings/lab') || 
                       pathname.includes('/reports') ||
                       pathname.includes('/pharmacy') ||
                       pathname.includes('/reception');
  
  const isMissingContext = needsContext && !user?.currentHospitalId;

  useEffect(() => {
    if (user?.superuser && isSuperMode) {
      const fetchHospitals = async () => {
        try {
          const res = await hospitalService.list({ page: 0, size: 100, status: 'ACTIVE' });
          if (res.success && res.data) {
            setHospitals(res.data.content);
          }
        } catch (error) {
          console.error('Failed to fetch hospitals for selector:', error);
        }
      };
      fetchHospitals();
    }
  }, [isSuperMode, user?.superuser]);

  if (!user?.superuser || !isSuperMode) {
    return null;
  }

  return (
    <div className={cn("flex flex-col min-w-[200px] transition-all duration-300", className)}>
      <select
        value={user?.currentHospitalId || ''}
        onChange={(e) => dispatch(setCurrentHospitalId(e.target.value || null))}
        className={cn(
          "w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer",
          isMissingContext 
            ? "border-orange-500 ring-4 ring-orange-500/20 bg-orange-50 animate-pulse shadow-lg shadow-orange-500/10" 
            : "border-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-slate-300"
        )}
      >
        <option value="">All Hospitals</option>
        {hospitals.map(h => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </select>
      {isMissingContext && (
        <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest mt-1 text-center animate-bounce">
          Select Context to proceed
        </span>
      )}
    </div>
  );
};

export default HospitalSelector;
