'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { MedicineResponse } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';

export const DoctorMedicineSearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [results, setResults] = useState<MedicineResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchMedicines = async () => {
      if (debouncedSearch.trim().length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await pharmacyApi.getAvailableMedicines(debouncedSearch);
        if (response.success && response.data) {
          setResults(response.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    searchMedicines();
  }, [debouncedSearch]);

  return (
    <MainLayout title="Doctor Medicine Search">
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Medicine Availability Lookup</h2>
          <p className="text-slate-500 mt-2 font-medium">Search by brand name, generic name, or composition to check real-time stock.</p>
          
          <div className="mt-8 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl">search</span>
            <input 
              className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-lg outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-inner" 
              placeholder="e.g. Paracetamol, Amoxicillin, or BP control..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <LoadingSkeleton />
              <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Querying Inventory...</p>
            </div>
          ) : results.length === 0 && debouncedSearch.length >= 2 ? (
            <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-200">search_off</span>
              <p className="mt-4 text-slate-800 font-bold">No medicines found</p>
              <p className="text-slate-500 text-sm">Try searching with a generic name or composition.</p>
            </div>
          ) : (
            results.map((medicine) => (
              <div key={medicine.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-200 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${medicine.currentStock! > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    <span className="material-symbols-outlined text-[28px]">medication</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${medicine.currentStock! > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {medicine.currentStock! > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-700 transition-colors">{medicine.name}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-wider">{medicine.genericName} • {medicine.category}</p>
                
                <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Availability</span>
                    <span className="text-sm font-black text-slate-800">{medicine.currentStock} Units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Composition</span>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{medicine.composition || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Price</span>
                    <span className="text-sm font-black text-orange-700">${(medicine.sellingPrice || 0).toFixed(2)}</span>
                  </div>
                </div>
                
                <button className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95">
                  View Full Details
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorMedicineSearchPage;
