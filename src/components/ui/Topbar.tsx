import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/state/store';
import { setActiveRole, setCurrentHospitalId } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { Role } from '@/types/api';
import GlobalSearch from './GlobalSearch';
import { cn } from '@/lib/cn';
import { ROLE_PATH_MAP } from '@/utils/constants';

import { useLayout } from '@/context/LayoutContext';

const Topbar: React.FC<{ isVisible?: boolean }> = ({ isVisible = true }) => {
  const router = useRouter();
  const { headerActions, isCompressed, toggleCompressed } = useLayout();
  const dispatch = useDispatch();
  const { user, isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextSwitch = (hospitalId: string, role: Role) => {
    dispatch(setCurrentHospitalId(hospitalId));
    dispatch(setActiveRole(role));
    setIsProfileOpen(false);
    const path = ROLE_PATH_MAP[role] || '';
    router.push(`/${path}`);
  };

  const roleLabel = isSuperMode ? 'SUPER ADMIN' : (activeRole || 'Select Role');

  return (
    <header className={cn(
      "bg-white flex justify-between items-center h-16 w-full sticky top-0 z-[60] border-b border-gray-200 shadow-sm font-manrope transition-all duration-500",
      !isVisible && "lg:translate-y-0 -translate-y-full"
    )}>
      <div className="flex items-center h-full">
        <div className={cn(
          "px-4 lg:px-6 flex items-center gap-3 transition-all duration-500 ease-in-out border-r border-transparent lg:border-gray-100 h-full lg:w-64"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <div className={cn(
              "flex flex-col leading-none transition-all duration-500 whitespace-nowrap opacity-100 translate-x-0"
            )}>
              <h1 className="text-xl font-black tracking-tight text-primary font-manrope">CareFlow</h1>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">System Intelligence</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center h-full px-6">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4 px-4 lg:px-6">
        {/* Simplified Hospital Context */}
        {!isSuperMode && (
          <div className="flex items-center px-4 py-2">
            <span className="text-xs font-black text-orange-600 uppercase tracking-widest">
              {user?.memberships?.find(m => m.hospitalId === user.currentHospitalId)?.hospitalName || 'System STANDALONE'}
            </span>
          </div>
        )}

        {headerActions && (
          <div className="hidden sm:flex items-center gap-3">
            {headerActions}
          </div>
        )}
        
        <div className="hidden sm:block h-6 w-px bg-gray-200 mx-2"></div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 lg:gap-3 p-1.5 rounded-full hover:bg-gray-50 transition-colors text-gray-500"
          >
            <span className="material-symbols-outlined text-2xl">account_circle</span>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-sm font-bold text-gray-700">{user?.username}</span>
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-tighter">{roleLabel}</span>
            </div>
            <span className="material-symbols-outlined text-sm hidden sm:inline">keyboard_arrow_down</span>
          </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-sm font-black text-[var(--text-primary)]">{user?.fullName || user?.username}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompressed();
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all",
                      isCompressed 
                        ? "bg-orange-600 border-orange-600 text-white shadow-sm shadow-orange-600/20" 
                        : "bg-white border-slate-200 text-slate-400 hover:border-orange-200 hover:text-orange-600"
                    )}
                  >
                    <span className="material-symbols-outlined text-[14px]">density_medium</span>
                    <span className="text-[9px] font-black uppercase tracking-tighter">Compressed</span>
                  </button>
                </div>

                {user?.memberships && user.memberships.length > 0 && (
                  <div className="px-2 py-1 bg-slate-50/50">
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Switch Context (Hospital & Role)</p>
                    </div>
                    <div className="space-y-3 px-1 pb-2">
                      {user.memberships.map((membership) => {
                        const isActiveHospital = user.currentHospitalId === membership.hospitalId;
                        const roles = membership.roleAssignments?.map(ra => ra.roleCode) || membership.roles || [];
                        
                        return (
                          <div key={membership.hospitalId} className={`p-2.5 rounded-2xl border transition-all ${isActiveHospital ? 'bg-white border-orange-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className="flex items-center gap-2 mb-2 px-1">
                              <span className={`material-symbols-outlined text-[16px] ${isActiveHospital ? 'text-orange-600' : 'text-slate-400'}`}>apartment</span>
                              <span className={`text-[10px] font-black uppercase tracking-wider truncate flex-1 ${isActiveHospital ? 'text-slate-900' : 'text-slate-600'}`}>
                                {membership.hospitalName}
                              </span>
                              {isActiveHospital && (
                                <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Current</span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5">
                              {roles.map((roleCode) => {
                                const isActiveRole = isActiveHospital && activeRole === roleCode;
                                return (
                                  <button
                                    key={roleCode}
                                    onClick={() => handleContextSwitch(membership.hospitalId, roleCode as Role)}
                                    className={cn(
                                      "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border",
                                      isActiveRole 
                                        ? "bg-orange-600 border-orange-600 text-white shadow-sm" 
                                        : "bg-slate-50 border-slate-100 text-slate-500 hover:border-orange-200 hover:text-orange-600"
                                    )}
                                  >
                                    {roleCode}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="p-2 border-t border-[var(--border)] mt-1">
                  <button
                    onClick={async () => {
                      try {
                        await authService.logout();
                        globalThis.location.href = '/login';
                      } catch (error) {
                        console.error('Logout failed', error);
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[var(--error-light)] text-[var(--error)]"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="text-sm font-bold">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </header>
  );
};

export default Topbar;
