import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { setSuperMode, setActiveRole, setUser } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { Role } from '@/types/api';

interface TopbarProps {
  title: string;
}

const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const dispatch = useDispatch();
  const { user, isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperUser = user?.roles.includes('SUPER_ADMIN');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHospitalSwitch = async (hospitalId: number) => {
    const res = await authService.selectHospital(hospitalId);
    if (res.success && res.data) {
      dispatch(setUser(res.data));
      setIsProfileOpen(false);
    }
  };

  const handleRoleSwitch = (role: Role) => {
    dispatch(setActiveRole(role));
    dispatch(setSuperMode(false)); // Switching to a normal role turns off super mode
    setIsProfileOpen(false);
  };

  const toggleSuperMode = () => {
    dispatch(setSuperMode(!isSuperMode));
    if (!isSuperMode) {
      dispatch(setActiveRole(null)); // Clear active role when entering super mode
    }
    setIsProfileOpen(false);
  };

  const currentHospitalName = user?.hospitals.find(h => h.hospitalId === user.hospitalId)?.hospitalName || 'System Level';

  const roleLabel = isSuperMode ? 'SUPER ADMIN' : (activeRole || 'Select Role');

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] bg-opacity-80 backdrop-blur-md px-6 py-3 lg:px-10">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
          <span className="material-symbols-outlined">health_and_safety</span>
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight tracking-tight text-[var(--text-primary)]">{title || 'HMS System'}</h2>
          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">{currentHospitalName}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 lg:gap-8">
        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          
          <div className="relative ml-2" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-[var(--background)] p-1.5 pr-3 rounded-xl transition-all"
            >
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-[var(--primary-light)] bg-[var(--background)] flex items-center justify-center">
                 <span className="material-symbols-outlined text-[var(--text-secondary)]">person</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-[var(--text-primary)] leading-none">{user?.username}</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase mt-1 tracking-wider">
                  {roleLabel}
                </p>
              </div>
              <span className={`material-symbols-outlined text-[var(--text-secondary)] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]/50">
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Signed in as</p>
                  <p className="text-sm font-black text-[var(--text-primary)]">{user?.username}</p>
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
                    {user?.roles.filter(r => r !== 'SUPER_ADMIN' || !isSuperMode).map(role => {
                      let roleIcon = 'person';
                      if (role === 'DOCTOR') {
                        roleIcon = 'medical_services';
                      } else if (role === 'ADMIN') {
                        roleIcon = 'admin_panel_settings';
                      }

                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleSwitch(role)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[var(--background)] ${activeRole === role ? 'text-[var(--primary)] bg-[var(--primary-light)]/50' : 'text-[var(--text-primary)]'}`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {roleIcon}
                          </span>
                          <span className="text-sm font-bold">{role}</span>
                          {activeRole === role && <span className="material-symbols-outlined ml-auto text-sm">check_circle</span>}
                        </button>
                      );
                    })}
                </div>

                {user?.hospitals && user.hospitals.length > 1 && (
                  <div className="px-2 py-1 border-t border-[var(--border)] mt-1">
                    <p className="px-3 py-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Switch Hospital</p>
                    {user.hospitals.map(h => (
                      <button
                        key={h.hospitalId}
                        onClick={() => handleHospitalSwitch(h.hospitalId)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[var(--background)] ${user.hospitalId === h.hospitalId ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}
                      >
                        <span className="material-symbols-outlined text-xl">apartment</span>
                        <div className="text-left">
                          <p className="text-sm font-bold leading-none">{h.hospitalName}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-1">{h.hospitalCode}</p>
                        </div>
                        {user.hospitalId === h.hospitalId && <span className="material-symbols-outlined ml-auto text-sm">check_circle</span>}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-2 border-t border-[var(--border)] mt-1">
                  <button
                    onClick={async () => {
                      try {
                        await authService.logout();
                        dispatch(logout());
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
      </div>
    </header>
  );
};

export default Topbar;

