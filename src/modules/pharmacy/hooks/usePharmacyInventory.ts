'use client';

import { useState, useEffect, useCallback } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { InventoryItemResponse } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

export const usePharmacyInventory = () => {
  const [items, setItems] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getInventoryItems({ search: debouncedSearch });
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
  }, [debouncedSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    searchTerm,
    setSearchTerm,
    showAddModal,
    setShowAddModal,
    selectedItem,
    setSelectedItem,
    refresh: fetchItems
  };
};
