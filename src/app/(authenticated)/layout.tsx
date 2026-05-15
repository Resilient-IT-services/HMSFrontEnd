'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import BottomNavigation from '@/components/ui/BottomNavigation';
import { MOBILE_BREAKPOINT } from '@/utils/constants';
import { cn } from '@/lib/cn';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isTopbarVisible, setIsTopbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const startHideTimer = useCallback(() => {
    if (typeof window === 'undefined' || window.innerWidth >= MOBILE_BREAKPOINT) {
      setIsTopbarVisible(true);
      return;
    }

    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setIsTopbarVisible(false);
    }, 3000); // 3 seconds of inactivity
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setIsTopbarVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      
      // Reappear on scroll up
      if (currentScrollY < lastScrollY.current) {
        setIsTopbarVisible(true);
      } else if (currentScrollY > 100) {
        setIsTopbarVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
      startHideTimer();
    };

    const handleInteraction = () => {
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setIsTopbarVisible(true);
        startHideTimer();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Reappear if tapping near the top (e.g., top 100px)
      if (e.touches[0].clientY < 100) {
        setIsTopbarVisible(true);
      }
      startHideTimer();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('click', handleInteraction);

    startHideTimer();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('click', handleInteraction);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [startHideTimer]);

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-x-hidden">
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] transition-transform duration-500 lg:sticky lg:translate-y-0",
          !isTopbarVisible && "-translate-y-full"
        )}
      >
        <Topbar isVisible={true} />
      </div>
      
      <div className="flex flex-1 relative">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <main 
            className={cn(
              "flex-1 p-3 lg:p-gutter w-full pb-20 lg:pb-gutter transition-all duration-500",
              isTopbarVisible ? "pt-20 lg:pt-gutter" : "pt-4 lg:pt-gutter"
            )}
          >
            {children}
          </main>
          
          <footer className="hidden lg:block px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-t border-slate-100 bg-white/50">
            CareFlow <span className="opacity-50">by Resilient</span> © 2026
          </footer>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
