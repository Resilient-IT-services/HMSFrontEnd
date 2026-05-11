'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';

export const VitalsPage = () => {
  return (
    <MainLayout title="Vitals Configuration">
      <div className="bg-white p-8 rounded-2xl border border-[var(--border)] shadow-sm">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Vitals Settings</h2>
        <p className="text-[var(--text-secondary)]">Configuration for patient vitals measurement ranges and units.</p>
        <div className="mt-8 py-12 text-center border-2 border-dashed border-[var(--border)] rounded-xl">
          <span className="material-symbols-outlined text-6xl text-[var(--text-secondary)] opacity-20">monitoring</span>
          <p className="mt-4 text-[var(--text-secondary)]">Vitals configuration interface coming soon.</p>
        </div>
      </div>
    </MainLayout>
  );
};
