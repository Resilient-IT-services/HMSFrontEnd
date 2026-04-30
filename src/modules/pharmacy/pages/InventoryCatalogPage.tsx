'use client';

import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import AddInventoryItemModal from '../components/AddInventoryItemModal';
import StockUpdateModal from '../components/StockUpdateModal';
import { InventoryItemResponse } from '@/types/api';

const InventoryCatalogPage = () => {
  const [items, setItems] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getInventoryItems({ search: searchTerm });
      if (response.success && response.data) {
        setItems(response.data.content);
      } else {
        // Mock data for demo
        setItems([
          { id: 'item-1', name: 'Disposable Syringe 5ml', category: 'Consumables', unit: 'pcs', currentStock: 1200, createdAt: new Date().toISOString() },
          { id: 'item-2', name: 'Surgical Gloves (Size 7)', category: 'Surgical', unit: 'pair', currentStock: 450, createdAt: new Date().toISOString() },
          { id: 'item-3', name: 'Absorbent Cotton 500g', category: 'Consumables', unit: 'roll', currentStock: 85, createdAt: new Date().toISOString() },
        ]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Inventory Item Catalog</h2>
          <p className="text-[var(--text-secondary)] mt-1">Manage generic hospital items, consumables, and surgical supplies.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          Define New Item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border-none rounded-xl text-sm outline-none" 
              placeholder="Search items by name or category..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-[var(--border)]">
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Item Name</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Unit</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Current Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr><td colSpan={5} className="p-8"><LoadingSkeleton /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="p-8"><EmptyState message="No inventory items found" /></td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">inventory_2</span>
                      </div>
                      <p className="font-bold text-[var(--text-primary)]">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{item.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${item.currentStock < 100 ? 'text-orange-600' : 'text-[var(--text-primary)]'}`}>
                      {item.currentStock} {item.unit}s
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedItem({ id: item.id, name: item.name })}
                      className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 ml-auto"
                    >
                      <span className="material-symbols-outlined text-lg">swap_vert</span>
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddInventoryItemModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchItems}
        />
      )}

      {selectedItem && (
        <StockUpdateModal 
          itemId={selectedItem.id}
          itemName={selectedItem.name}
          onClose={() => setSelectedItem(null)}
          onSuccess={fetchItems}
        />
      )}
    </div>
  );
};

export default InventoryCatalogPage;
