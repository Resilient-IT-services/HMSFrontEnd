'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';

export default function PatientsPage() {
  return (
    <MainLayout title="Patients">
      <Card>
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-[var(--text-secondary)] opacity-20">group</span>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mt-4">Patient Management</h2>
          <p className="text-[var(--text-secondary)] mt-2">This feature is coming soon.</p>
        </div>
      </Card>
    </MainLayout>
  );
}
