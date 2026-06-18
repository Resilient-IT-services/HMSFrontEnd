'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { searchService } from '@/services/searchService';
import { SearchResultDTO as SearchResult } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';
import { DEFAULT_DEBOUNCE_MS } from '@/utils/constants';

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, DEFAULT_DEBOUNCE_MS);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const { activeRole, isSuperMode } = useSelector((state: RootState) => state.auth);

  const isSuperAdmin = isSuperMode || activeRole === 'SUPER_ADMIN';
  const isReceptionist = activeRole === 'RECEPTIONIST';
  const isDoctor = activeRole === 'DOCTOR';
  const isPharmacist = activeRole === 'PHARMACIST';

  useEffect(() => {
    const handleSearch = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const res = await searchService.search(debouncedQuery);
        if (res.success && res.data) {
          let content = res.data.content || [];
          
          // Filter results based on role requirements
          if (isSuperAdmin) {
            content = content.filter(r => r.type !== 'PATIENT');
          } else if (isReceptionist || isDoctor) {
            content = content.filter(r => r.type === 'PATIENT');
          }

          setResults(content);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setLoading(false);
      }
    };

    if (!isPharmacist) {
      handleSearch();
    }
  }, [debouncedQuery, isSuperAdmin, isReceptionist, isDoctor, isPharmacist]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isPharmacist) return null;

  const handleSelect = (result: SearchResult) => {
    router.push(result.link);
    setIsOpen(false);
    setQuery('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'HOSPITAL': { return 'local_hospital';
      }
      case 'USER': { return 'person';
      }
      case 'PATIENT': { return 'personal_injury';
      }
      default: { return 'search';
      }
    }
  };

  const getPlaceholder = () => {
    if (isSuperAdmin) return "Search Hospitals, Users...";
    if (isReceptionist || isDoctor) return "Search Patients...";
    return "Search Hospitals, Users, Patients...";
  };

  return (
    <div className="hidden md:flex items-center relative ml-4" ref={searchRef}>
      <span className="material-symbols-outlined absolute left-3 text-gray-400 text-lg">search</span>
      <input 
        className="bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm w-80 focus:ring-2 focus:ring-primary-container outline-none" 
        placeholder={getPlaceholder()} 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none text-left"
                >
                  <div className={`p-2 rounded-lg bg-gray-100 text-gray-600`}>
                    <span className="material-symbols-outlined text-lg">{getIcon(result.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{result.title}</p>
                    <p className="text-xs text-gray-500 truncate">{result.subtitle} • <span className="text-[10px] font-black uppercase tracking-widest">{result.type}</span></p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
