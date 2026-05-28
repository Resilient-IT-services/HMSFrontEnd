'use client';

import React, { useState, useEffect, useRef } from 'react';
import { patientService } from '@/services/patientService';
import { PatientResponse } from '@/types/api';
import useDebounce from '@/hooks/useDebounce';

interface PatientSearchProps {
  onSelect: (patient: PatientResponse) => void;
  defaultValue?: string;
}

const PatientSearch: React.FC<PatientSearchProps> = ({ onSelect, defaultValue = '' }) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  const [results, setResults] = useState<PatientResponse[]>([]);
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
        const response = await patientService.list(0, 5, debouncedSearch);
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
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">person_search</span>
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search by name, phone or code..."
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
          {results.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => {
                onSelect(patient);
                setSearchTerm(patient.fullName);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-none group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-on-surface group-hover:text-primary">{patient.fullName}</p>
                  <p className="text-[10px] text-gray-500">{patient.patientCode} • {patient.phone}</p>
                </div>
                <span className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-black uppercase rounded text-gray-400">Patient</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;
