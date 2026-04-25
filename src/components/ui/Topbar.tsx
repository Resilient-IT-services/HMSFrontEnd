import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { setSuperMode, setActiveRole, setUser, setCurrentHospitalId } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { Role } from '@/types/api';
import GlobalSearch from './GlobalSearch';

import { useLayout } from '@/context/LayoutContext';

const Topbar: React.FC = () => {
  const { title, headerActions } = useLayout();
  const dispatch = useDispatch();
  const { user, isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperUser = user?.roles?.includes('SUPER_ADMIN');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHospitalSwitch = (hospitalId: string) => {
    dispatch(setCurrentHospitalId(hospitalId));
    setIsProfileOpen(false);
    window.location.reload();
  };

  const handleRoleSwitch = (role: Role) => {
    dispatch(setActiveRole(role));
    dispatch(setSuperMode(false)); // Switching to a normal role turns off super mode
    setIsProfileOpen(false);
    window.location.reload();
  };

  const toggleSuperMode = () => {
    dispatch(setSuperMode(!isSuperMode));
    if (!isSuperMode) {
      dispatch(setActiveRole(null)); // Clear active role when entering super mode
    }
    setIsProfileOpen(false);
  };
  const currentHospitalName = user?.detailedMemberships.find(h => h.hospitalId === user.currentHospitalId)?.hospitalName || 'System Level';

  const roleLabel = isSuperMode ? 'SUPER ADMIN' : (activeRole || 'Select Role');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DOCTOR': return 'stethoscope';
      case 'ADMIN': return 'admin_panel_settings';
      case 'RECEPTIONIST': return 'desk';
      case 'PHARMACIST': return 'prescriptions';
      case 'NURSE': return 'vital_signs';
      case 'SUPER_ADMIN': return 'shield_person';
      default: return 'person';
    }
  };

  return (
    <header className="bg-white flex justify-between items-center h-16 w-full sticky top-0 z-40 border-b border-gray-200 shadow-sm font-manrope antialiased">
      <div className="flex items-center">
        <div className="w-64 px-6">
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">VitalSync HMS</h1>
        </div>
        <GlobalSearch />
        <div className="h-8 w-px bg-gray-200 mx-6"></div>
        <h2 className="font-headline-sm text-gray-700 uppercase tracking-widest text-xs font-black">{currentHospitalName}</h2>
      </div>

      <div className="flex items-center gap-4 px-6">
        {headerActions && (
          <div className="flex items-center gap-3">
            {headerActions}
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
          </div>
        )}
        
        <div className="h-6 w-px bg-gray-200"></div>

        <button className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-500">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-gray-50 transition-colors text-gray-500"
          >
            <span className="material-symbols-outlined text-2xl">account_circle</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-sm font-bold text-gray-700">{user?.username}</span>
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-tighter">{roleLabel}</span>
            </div>
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
          </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]/50">
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Signed in as</p>
                  <p className="text-sm font-black text-[var(--text-primary)]">{user?.fullName || user?.username}</p>
                </div>

                <div className="p-2">
                  {isSuperUser && (
                    <button 
                      onClick={toggleSuperMode}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isSuperMode ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'hover:bg-[var(--background)] text-[var(--text-secondary)]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined">shield_person</span>
                        <span className="text-sm font-bold">Super User Mode</span>
                      </div>
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${isSuperMode ? 'bg-[var(--primary)]' : 'bg-slate-300'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isSuperMode ? 'right-0.5' : 'left-0.5'}`}></div>
                      </div>
                    </button>
                  )}
                </div>

                <div className="px-2 py-1">
                  <p className="px-3 py-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Available Roles</p>
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

                {user?.detailedMemberships && user.detailedMemberships.length > 1 && (
                  <div className="px-2 py-1 border-t border-[var(--border)] mt-1">
                    <p className="px-3 py-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Switch Hospital</p>
                    {user.detailedMemberships.map(h => (
                      <button
                        key={h.hospitalId}
                        onClick={() => handleHospitalSwitch(h.hospitalId)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[var(--background)] ${user.currentHospitalId === h.hospitalId ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}
                      >
                        <span className="material-symbols-outlined text-xl">apartment</span>
                        <div className="text-left">
                          <p className="text-sm font-bold leading-none">{h.hospitalName}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-1">{h.hospitalCode}</p>
                        </div>
                        {user.currentHospitalId === h.hospitalId && <span className="material-symbols-outlined ml-auto text-sm">check_circle</span>}
                      </button>
                    ))}
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

