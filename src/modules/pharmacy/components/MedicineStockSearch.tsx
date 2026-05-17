'use client';

import React, { useState, useEffect, useRef } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { PharmacyStockDTO } from '@/types/api';
import useDebounce from '@/hooks/useDebounce';
import { formatCurrency } from '@/utils/formatters';

interface MedicineStockSearchProps {
  onSelect: (stock: PharmacyStockDTO) => void;
  placeholder?: string;
}

const MedicineStockSearch: React.FC<MedicineStockSearchProps> = ({ 
  onSelect, 
  placeholder = "Search medicine name or batch number..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PharmacyStockDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedSearch.trim().length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await pharmacyApi.getMedicineStock({ search: debouncedSearch, size: 10 });
        if (response.success && response.data) {
          setResults(response.data.content || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none font-bold"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-outline-variant rounded-2xl shadow-2xl max-h-80 overflow-y-auto p-1">
          {results.map((stock) => (
            <button
              key={stock.id}
              type="button"
              onClick={() => {
                onSelect(stock);
                setSearchTerm('');
                setShowDropdown(false);
              }}
              className="w-full text-left p-3 hover:bg-primary/5 transition-all border-b border-gray-50 last:border-none rounded-xl group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-on-surface group-hover:text-primary transition-colors">{stock.medicineName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] font-black uppercase rounded text-slate-500 font-mono">
                      BATCH: {stock.batchNumber}
                    </span>
                    {stock.expiryDate && (
                      <span className={`text-[9px] font-black uppercase ${new Date(stock.expiryDate) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                        Exp: {new Date(stock.expiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-primary">
                    {formatCurrency(stock.sellingPrice || 0)}
                  </p>
                  <p className={`text-[10px] font-black mt-0.5 ${stock.quantity < 10 ? 'text-red-500 animate-pulse' : 'text-green-600'}`}>
                    {stock.quantity} in stock
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineStockSearch;
