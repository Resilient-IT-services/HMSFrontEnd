'use client';

import React from 'react';
import { Table, Column } from '@/components/ui/Table';
import { InventoryItemResponse } from '@/types/api';
import { usePharmacyInventory } from '../hooks/usePharmacyInventory';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import AddInventoryItemModal from '../components/AddInventoryItemModal';
import StockUpdateModal from '../components/StockUpdateModal';

import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';

const InventoryCatalogPage = () => {
  const {
    items,
    loading,
    searchTerm,
    setSearchTerm,
    columnFilters,
    setColumnFilters,
    showAddModal,
    setShowAddModal,
    selectedItem,
    setSelectedItem,
    refresh
  } = usePharmacyInventory();

  const columns: Column<InventoryItemResponse>[] = [
    {
      header: 'Item Name',
      filterable: true,
      filterPlaceholder: 'Item name...',
      render: (item) => (
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-sm">inventory_2</span>
          </div>
          <p className="font-bold text-slate-900">{item.name}</p>
        </div>
      )
    },
    {
      header: 'Category',
      filterable: true,
      filterPlaceholder: 'Category...',
      render: (item) => <Badge variant="slate">{item.category}</Badge>
    },
    {
      header: 'Unit',
      key: 'unit',
      className: 'text-sm text-slate-500 font-medium text-center'
    },
    {
      header: 'Current Stock',
      render: (item) => (
        <span className={`text-sm font-black ${item.currentStock < 100 ? 'text-orange-600' : 'text-slate-900'}`}>
          {item.currentStock} {item.unit}s
        </span>
      )
    },
    {
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (item) => (
        <Button 
          variant="secondary" 
          size="sm" 
          icon="swap_vert"
          onClick={() => setSelectedItem({ id: item.id, name: item.name })}
        >
          Update Stock
        </Button>
      )
    }
  ];

  return (
    <MainLayout 
      title="Inventory Item Catalog"
      headerActions={
        <Button icon="add" onClick={() => setShowAddModal(true)}>
          Define New Item
        </Button>
      }
      hideTitle
    >
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-4 py-2 md:py-4">
          <PageHeading
            title="Inventory Item Catalog"
            description="Manage the master list of all pharmaceutical and clinical items."
          />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/30">
              <div className="max-w-md">
                <SearchInput 
                  placeholder="Search items by name or category..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Table 
              columns={columns} 
              data={items} 
              isLoading={loading}
              loadingMessage="Loading inventory catalog..."
              emptyMessage="No inventory items found"
              onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
              activeFilters={columnFilters}
            />
          </div>

          {showAddModal && (
            <AddInventoryItemModal 
              onClose={() => setShowAddModal(false)}
              onSuccess={refresh}
            />
          )}

          {selectedItem && (
            <StockUpdateModal 
              itemId={selectedItem.id}
              itemName={selectedItem.name}
              onClose={() => setSelectedItem(null)}
              onSuccess={refresh}
            />
          )}
        </div>
      </PageSurface>
    </MainLayout>
  );
};

export default InventoryCatalogPage;
