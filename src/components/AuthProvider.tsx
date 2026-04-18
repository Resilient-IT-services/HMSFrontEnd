'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { setUser, setLoading, setError, setActiveRole, setSuperMode } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { usePathname, useRouter } from 'next/navigation';
import { Role } from '@/types/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch(setLoading(true));
        const response = await authService.me();
        if (response.success && response.data) {
          dispatch(setUser(response.data));
        } else {
          dispatch(setUser(null));
        }
      } catch (error) {
        dispatch(setError('Failed to authenticate'));
        dispatch(setUser(null));
      }
    };

    checkAuth();
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        if (pathname !== '/login') {
          router.push('/login');
        }
        return;
      }

      // Logic for authenticated users
      const isSuperUser = user?.roles.includes('SUPER_ADMIN');

      // 1. Super User Flow
      if (isSuperUser) {
        // If they are ONLY Super Admin, force Super Mode
        if (user?.roles.length === 1 && !isSuperMode) {
          dispatch(setSuperMode(true));
          return;
        }

        // If in Super Mode, go to Super Admin Dashboard
        if (isSuperMode) {
          if (pathname !== '/super_admin/dashboard') {
            router.push('/super_admin/dashboard');
          }
          return;
        }
      }

      // 2. Hospital Selection Flow
      if (!user?.hospital_id) {
        if (user?.hospitals && user.hospitals.length > 1) {
          if (pathname !== '/select-hospital') {
            router.push('/select-hospital');
          }
        } else if (user?.hospitals && user.hospitals.length === 1) {
          // Auto select if only one
          authService.selectHospital(user.hospitals[0].hospital_id).then(res => {
            if (res.success && res.data) dispatch(setUser(res.data));
          });
        } else if (!isSuperUser) {
           // No hospitals and not super admin? 
           if (pathname !== '/unauthorized') router.push('/unauthorized');
        } else {
           // Super user with no hospitals and not in super mode? 
           // Should probably be in super mode
           dispatch(setSuperMode(true));
        }
        return;
      }

      // 3. Role Selection Flow
      if (!activeRole) {
        if (user.roles && user.roles.length > 1) {
          if (pathname !== '/select-role') {
            router.push('/select-role');
          }
        } else if (user.roles && user.roles.length === 1) {
          dispatch(setActiveRole(user.roles[0]));
        } else {
           if (pathname !== '/unauthorized') router.push('/unauthorized');
        }
        return;
      }

      // 4. Final Dashboard Redirection
      if (pathname === '/login' || pathname === '/select-hospital' || pathname === '/select-role') {
        const rolePathMap: Record<string, string> = {
          'RECEPTIONIST': 'reception',
          'DOCTOR': 'doctor',
          'PHARMACIST': 'pharmacy',
          'ADMIN': 'admin',
          'SUPER_ADMIN': 'super_admin',
          'NURSE': 'nurse'
        };
        const path = rolePathMap[activeRole] || activeRole.toLowerCase();
        router.push(`/${path}/dashboard`);
      }
    }
  }, [isLoading, isAuthenticated, pathname, router, user, isSuperMode, activeRole, dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div data-testid="loader" className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return <>{children}</>;
};
