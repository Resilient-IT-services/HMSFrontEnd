'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import InventoryCatalogPage from '@/modules/pharmacy/pages/InventoryCatalogPage';

export default function InventoryPage() {
  return (
    <MainLayout title="Inventory Item Catalog">
      <InventoryCatalogPage />
    </MainLayout>
  );
}
