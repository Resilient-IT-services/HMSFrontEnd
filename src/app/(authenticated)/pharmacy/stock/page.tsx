'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';

export default function StockPage() {
  return (
    <MainLayout title="Inventory">
      <Card>
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-[var(--text-secondary)] opacity-20">inventory_2</span>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mt-4">Stock Management</h2>
          <p className="text-[var(--text-secondary)] mt-2">This feature is coming soon.</p>
        </div>
      </Card>
    </MainLayout>
  );
}
