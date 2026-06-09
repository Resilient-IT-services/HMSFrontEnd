import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { setActiveRole } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { Role } from '@/types/api';
import GlobalSearch from './GlobalSearch';
import { cn } from '@/lib/cn';

import { useLayout } from '@/context/LayoutContext';
import HospitalSelector from './HospitalSelector';

const Topbar: React.FC<{ isVisible?: boolean }> = ({ isVisible = true }) => {
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

  const handleRoleSwitch = (role: Role) => {
    dispatch(setActiveRole(role));
    setIsProfileOpen(false);
    globalThis.location.reload();
  };

  const roleLabel = isSuperMode ? 'SUPER ADMIN' : (activeRole || 'Select Role');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DOCTOR': { return 'stethoscope';
      }
      case 'ADMIN': { return 'admin_panel_settings';
      }
      case 'RECEPTIONIST': { return 'desk';
      }
      case 'PHARMACIST': { return 'prescriptions';
      }
      case 'NURSE': { return 'vital_signs';
      }
      case 'SUPER_ADMIN': { return 'shield_person';
      }
      default: { return 'person';
      }
    }
  };

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
        <HospitalSelector />

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
                <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]/50">
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Signed in as</p>
                  <p className="text-sm font-black text-[var(--text-primary)]">{user?.fullName || user?.username}</p>
                </div>

                {!user?.superuser &&
                <div className="px-2 py-1">
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Available Roles</p>
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
                    {user?.roles?.filter(r => r !== 'SUPER_ADMIN' || !isSuperMode).map(role => (
                        <button
                          key={role}
                          onClick={() => handleRoleSwitch(role)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[var(--background)] ${activeRole === role ? 'text-[var(--primary)] bg-[var(--primary-light)]/50' : 'text-[var(--text-primary)]'}`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {getRoleIcon(role)}
                          </span>
                          <span className="text-sm font-bold">{role}</span>
                          {activeRole === role && <span className="material-symbols-outlined ml-auto text-sm">check_circle</span>}
                        </button>
                      )
                    )}
                </div>
            }

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
