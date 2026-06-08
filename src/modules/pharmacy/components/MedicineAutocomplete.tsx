'use client';

import React, { useState, useEffect, useRef } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { MedicineResponse } from '@/types/api';
import useDebounce from '@/hooks/useDebounce';

interface MedicineAutocompleteProps {
  onSelect: (medicine: any) => void; // Can be MedicineResponse or MedicineSummaryDTO
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  stockOnly?: boolean;
}

const MedicineAutocomplete: React.FC<MedicineAutocompleteProps> = ({ 
  onSelect, 
  placeholder = "Search for medicine...",
  className = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none",
  defaultValue = "",
  stockOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  const [results, setResults] = useState<MedicineResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (defaultValue !== prevDefaultValue) {
    setSearchTerm(defaultValue);
    setPrevDefaultValue(defaultValue);
  }

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedSearch.trim().length < 2 || debouncedSearch === defaultValue) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await (stockOnly ? pharmacyApi.getMedicineStock({ search: debouncedSearch, size: 10 }) : pharmacyApi.getMedicinesSummary({ search: debouncedSearch, size: 10 }));

        if (response.success && response.data) {
          // Normalize results: convert PharmacyStockDTO to a format similar to MedicineResponse for the dropdown
          const normalized = (response.data.content || []).map((item: any) => ({
            id: item.id,
            medicineId: item.medicineId || item.id,
            name: item.medicineName || item.name,
            genericName: item.genericName,
            composition: item.composition,
            form: item.form,
            category: item.category,
            manufacturer: item.manufacturer,
            currentStock: item.quantity === undefined ? item.currentStock : item.quantity,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            sellingPrice: item.sellingPrice || item.price,
            hsnCode: item.hsnCode
          }));
          setResults(normalized as any);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearch, defaultValue, stockOnly]);

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
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className={className}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-outline-variant rounded-xl shadow-xl max-h-60 overflow-y-auto p-1">
          {results.map((medicine: any) => (
            <button
              key={medicine.id}
              type="button"
              onClick={() => {
                onSelect(medicine);
                setSearchTerm(medicine.name);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-none group rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">{medicine.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-black uppercase rounded text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {medicine.form || medicine.category || 'General'}
                    </span>
                    {medicine.manufacturer && (
                      <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[120px]">
                        {medicine.manufacturer}
                      </p>
                    )}
                  </div>
                  {medicine.composition && (
                    <p className="text-[10px] text-gray-500 line-clamp-1 italic mt-1 font-medium">{medicine.composition}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-xs font-black ${ (medicine.currentStock || 0) <= 0 ? 'text-red-500' : (medicine.currentStock || 0) < 10 ? 'text-orange-500' : 'text-green-600'}`}>
                    {(medicine.currentStock || 0) > 0 ? `${medicine.currentStock} Units` : 'Out of Stock'}
                  </p>
                  <div className="flex flex-col items-end gap-0.5 mt-0.5">
                    {medicine.batchNumber && (
                      <p className="text-[9px] font-mono font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        #{medicine.batchNumber}
                      </p>
                    )}
                    {medicine.expiryDate && (
                      <p className={`text-[9px] font-black uppercase ${new Date(medicine.expiryDate) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
                        EXP: {new Date(medicine.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineAutocomplete;
