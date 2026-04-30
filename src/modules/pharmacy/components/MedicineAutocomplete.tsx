'use client';

import React, { useState, useEffect, useRef } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { MedicineResponse } from '@/types/api';
import useDebounce from '@/hooks/useDebounce';

interface MedicineAutocompleteProps {
  onSelect: (medicine: MedicineResponse) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

const MedicineAutocomplete: React.FC<MedicineAutocompleteProps> = ({ 
  onSelect, 
  placeholder = "Search for medicine...",
  className = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none",
  defaultValue = ""
}) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [results, setResults] = useState<MedicineResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedSearch.length < 2 || debouncedSearch === defaultValue) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await pharmacyApi.getMedicines({ search: debouncedSearch, size: 10 });
        if (response.success && response.data) {
          setResults(response.data.content);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearch, defaultValue]);

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
        <div className="absolute z-[100] w-full mt-1 bg-white border border-outline-variant rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((medicine) => (
            <button
              key={medicine.id}
              type="button"
              onClick={() => {
                onSelect(medicine);
                setSearchTerm(medicine.name);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-none group"
            >
              <p className="font-bold text-on-surface group-hover:text-primary">{medicine.name}</p>
              {medicine.composition && (
                <p className="text-[10px] text-gray-500 line-clamp-1">{medicine.composition}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineAutocomplete;
