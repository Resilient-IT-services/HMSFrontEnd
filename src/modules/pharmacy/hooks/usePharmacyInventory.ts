'use client';

import { useState, useEffect, useCallback } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { InventoryItemResponse } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

export const usePharmacyInventory = () => {
  const [items, setItems] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<string | undefined>();
  const debouncedSearch = useDebounce(searchTerm, 500);
  const debouncedColumnFilters = useDebounce(columnFilters, 500);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getInventoryItems({ 
        search: debouncedSearch,
        sort,
        ...debouncedColumnFilters
      });
      if (response.success && response.data) {
        setItems(response.data.content);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, debouncedColumnFilters, sort]);

  useEffect(() => {
    const trigger = async () => {
      await fetchItems();
    };
    void trigger();
  }, [fetchItems]);

  return {
    items,
    loading,
    searchTerm,
    setSearchTerm,
    columnFilters,
    setColumnFilters,
    sort,
    setSort,
    showAddModal,
    setShowAddModal,
    selectedItem,
    setSelectedItem,
    refresh: fetchItems
  };
};
