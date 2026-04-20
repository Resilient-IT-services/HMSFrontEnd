'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';

interface RoleDashboardProps {
  title: string;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({ title }) => {
  return (
    <MainLayout title={title}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl">
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] font-medium">Overview</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">Welcome</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            This dashboard is under construction. Please use the sidebar to navigate to available features.
          </p>
        </Card>
      </div>
    </MainLayout>
  );
};
