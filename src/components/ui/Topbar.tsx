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
    <header className="bg-white flex justify-between items-center h-16 px-6 w-full sticky top-0 z-40 border-b border-gray-200 shadow-sm font-manrope antialiased">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900 md:hidden">VitalSync HMS</h1>
        <div className="hidden md:flex items-center relative">
          <span className="material-symbols-outlined absolute left-3 text-gray-400 text-lg">search</span>
          <input className="bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-orange-200 outline-none" placeholder="Search across hospital..." type="text"/>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user?.hospitals && user.hospitals.length > 1 && (
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">domain</span>
            <span>{currentHospitalName}</span>
          </button>
        )}
        
        <div className="h-6 w-px bg-gray-200"></div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-500">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          
          <div className="relative ml-2" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 p-1 rounded-lg transition-all"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden border border-orange-200 bg-slate-100 flex items-center justify-center">
                 <span className="material-symbols-outlined text-gray-500">account_circle</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-none">{user?.username}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-wider">
                  {roleLabel}
                </p>
              </div>
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

