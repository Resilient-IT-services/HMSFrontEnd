'use client';

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { useRouter } from 'next/navigation';

export default function PharmacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeRole, isLoading, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && activeRole !== 'PHARMACIST' && activeRole !== 'SUPER_ADMIN') {
      router.push('/unauthorized');
    }
  }, [activeRole, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (activeRole !== 'PHARMACIST' && activeRole !== 'SUPER_ADMIN') {
    return null;
  }

  return <>{children}</>;
}
