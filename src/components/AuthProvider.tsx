'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { setUser, setLoading, setError } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { usePathname, useRouter } from 'next/navigation';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

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
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated && pathname === '/login') {
        // Redirect to their primary role-based dashboard
        if (user?.roles && user.roles.length > 0) {
          router.push(`/${user.roles[0].toLowerCase()}/dashboard`);
        }
      }
    }
  }, [isLoading, isAuthenticated, pathname, router, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return <>{children}</>;
};
