'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { logout } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { getFilteredMenuItems } from '@/lib/navigation';
import { useLayout } from '@/context/LayoutContext';
import { cn } from '@/lib/cn';
import HelpDeskModal from '@/components/HelpDeskModal';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);
  const { isSidebarOpen, toggleSidebar } = useLayout();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      router.push('/login');
    } catch {
      // Error handled by interceptor or failed logout is non-critical for redirection
    }
  };

  const isExpanded = isSidebarOpen || isHovered;

  // If in super mode, we act as super admin regardless of activeRole
  const effectiveRole = isSuperMode ? 'SUPER_ADMIN' : activeRole;
  const filteredMenuItems = getFilteredMenuItems(effectiveRole);

  return (
    <aside 
      className={cn(
        "bg-white h-full border-r border-gray-200 flex flex-col p-3 transition-all duration-500 ease-in-out z-[50] hidden lg:flex group overflow-hidden shrink-0",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Header: Swaps Hamburger for Main Menu */}
      <div className="flex items-center px-2 mb-6 h-10 overflow-hidden">
        {isExpanded ? (
          <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-left-4 duration-500">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
              Main Menu
            </p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors shrink-0"
              title="Collapse Menu"
            >
              <span className="material-symbols-outlined text-xl">menu_open</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center w-full animate-in fade-in zoom-in duration-500">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-orange-600 transition-colors"
              title="Expand Menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar px-1">
        {filteredMenuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-3 py-3 transition-all duration-300 font-manrope text-sm font-bold rounded-xl overflow-hidden group/item",
                isActive
                  ? 'bg-orange-600/10 text-orange-700 shadow-sm shadow-orange-600/5'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <span className={cn(
                "material-symbols-outlined text-2xl shrink-0 transition-transform duration-300",
                isActive && "scale-110"
              )} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className={cn(
                "transition-all duration-500 whitespace-nowrap",
                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
              )}>
                {item.name}
              </span>
              {!isExpanded && (
                <div className="absolute left-16 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60]">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5 pt-4 border-t border-gray-100 px-1">
        <button
            onClick={() => setIsHelpOpen(true)}
            className={cn(
                "flex items-center gap-4 px-3 py-3 text-slate-500 hover:bg-slate-50 hover:text-orange-600 transition-all font-manrope text-sm font-bold rounded-xl cursor-pointer overflow-hidden group/item relative w-full"
            )}>
          <span className="material-symbols-outlined text-2xl shrink-0">help</span>
          <span className={cn(
            "transition-all duration-500 whitespace-nowrap",
            isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
          )}>
            Support
          </span>
          {!isExpanded && (
            <div className="absolute left-16 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60]">
              Support
            </div>
          )}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-4 px-3 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-manrope text-sm font-bold w-full text-left rounded-xl overflow-hidden group/item relative"
          )}
        >
          <span className="material-symbols-outlined text-2xl shrink-0">logout</span>
          <span className={cn(
            "transition-all duration-500 whitespace-nowrap",
            isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
          )}>
            Logout
          </span>
          {!isExpanded && (
            <div className="absolute left-16 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60]">
              Logout
            </div>
          )}
        </button>
      </div>

      <HelpDeskModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
      />

    </aside>
  );
};

export default Sidebar;
