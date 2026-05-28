'use client';

import React, { useState, useEffect, useRef } from 'react';
import { doctorService } from '@/services/doctorService';
import { DoctorStaffResponse } from '@/types/api';
import useDebounce from '@/hooks/useDebounce';
import { getPrimaryDepartment, getPrimarySpecialization } from '@/utils/staffDisplay';

interface DoctorSearchProps {
  onSelect: (doctor: DoctorStaffResponse) => void;
  defaultValue?: string;
}

const DoctorSearch: React.FC<DoctorSearchProps> = ({ onSelect, defaultValue = '' }) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  const [results, setResults] = useState<DoctorStaffResponse[]>([]);
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
        const response = await doctorService.list(0, 5, debouncedSearch);
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
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">medical_services</span>
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search by doctor name..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-outline-variant rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((doctor) => (
            <button
              key={doctor.userId}
              type="button"
              onClick={() => {
                onSelect(doctor);
                setSearchTerm(doctor.fullName);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-none group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-on-surface group-hover:text-primary">{doctor.fullName}</p>
                  <p className="text-[10px] text-gray-500">{getPrimarySpecialization(doctor)} • {getPrimaryDepartment(doctor)}</p>
                </div>
                <span className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-black uppercase rounded text-gray-400">Doctor</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;
