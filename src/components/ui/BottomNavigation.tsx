'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { getFilteredMenuItems } from '@/lib/navigation';
import { cn } from '@/lib/cn';

const BottomNavigation = () => {
  const pathname = usePathname();
  const { isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);

  const effectiveRole = isSuperMode ? 'SUPER_ADMIN' : activeRole;
  const filteredMenuItems = getFilteredMenuItems(effectiveRole);
  
  // Only show first 5 items on bottom nav to prevent clutter
  const navItems = filteredMenuItems.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[60] pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200 active:scale-90",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              <span 
                className={cn(
                  "material-symbols-outlined text-2xl transition-transform",
                  isActive && "scale-110"
                )}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tight truncate max-w-[64px]">
                {item.name}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
