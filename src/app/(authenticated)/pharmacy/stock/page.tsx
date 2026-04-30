'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';
import EmptyState from '@/modules/pharmacy/components/EmptyState';
import AddMedicineModal from '@/modules/pharmacy/pages/AddMedicineModal';
import StockUpdateModal from '@/modules/pharmacy/components/StockUpdateModal';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { MedicineResponse } from '@/types/api';

export default function StockPage() {
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<{ id: string; name: string } | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getMedicines({ search: debouncedSearch });
      if (response.success && response.data) {
        setMedicines(response.data.content);
      } else {
        // Enhanced Mock data fallback with filtering
        const mockData: MedicineResponse[] = [
          { 
            id: '1', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Capsule', 
            batchNumber: 'AMX-2023-014', expiryDate: '2025-10-12', sellingPrice: 12.5, 
            currentStock: 450, manufacturer: 'PharmaCorp', reorderLevel: 100
          },
          { 
            id: '2', name: 'Lisinopril 10mg', genericName: 'Lisinopril', category: 'Tablet', 
            batchNumber: 'LIS-B92-X0', expiryDate: '2024-08-15', sellingPrice: 8.2, 
            currentStock: 12, manufacturer: 'GlobalMed', reorderLevel: 50
          },
          { 
            id: '3', name: 'Metformin 850mg', genericName: 'Metformin', category: 'Tablet', 
            batchNumber: 'MET-2023-991', expiryDate: '2026-11-30', sellingPrice: 14, 
            currentStock: 0, manufacturer: 'HealthPlus', reorderLevel: 20
          }
        ];
        
        const filtered = mockData.filter(m => 
          m.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          m.category?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          m.batchNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
        setMedicines(filtered);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [debouncedSearch]);

  return (
    <MainLayout title="Medicine Master Inventory">
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Stock Management</h2>
            <p className="text-slate-500 mt-1 font-medium">Manage clinical stock levels, batch expiries, and unit pricing.</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/pharmacy/inventory"
              className="flex items-center gap-2 px-6 py-3 border border-blue-100 bg-blue-50/30 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              Generic Inventory
            </Link>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-700/20 hover:bg-orange-800 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Add Medicine
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Items</p>
            <h3 className="text-3xl font-black text-slate-800 mt-2">{medicines.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Low Stock</p>
            <h3 className="text-3xl font-black text-orange-600 mt-2">{medicines.filter(m => m.currentStock! > 0 && m.currentStock! < (m.reorderLevel || 50)).length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Out of Stock</p>
            <h3 className="text-3xl font-black text-red-600 mt-2">{medicines.filter(m => m.currentStock === 0).length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Inventory Value</p>
            <h3 className="text-3xl font-black text-blue-600 mt-2">
              ${medicines.reduce((acc, m) => acc + ((m.sellingPrice ?? 0) * (m.currentStock ?? 0)), 0).toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="relative max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all" 
                placeholder="Search medicine, batch, or category..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Medicine & Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Stock Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="p-8"><LoadingSkeleton /></td></tr>
              ) : medicines.length === 0 ? (
                <tr><td colSpan={6} className="p-8"><EmptyState message="No inventory found matching your search" /></td></tr>
              ) : (
                medicines.map((medicine) => (
                  <tr key={medicine.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${medicine.currentStock === 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                          <span className="material-symbols-outlined text-[20px]">medication</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{medicine.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{medicine.genericName} • {medicine.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-tighter">
                        {medicine.batchNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${medicine.expiryDate && new Date(medicine.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-600'}`}>
                          {medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric', day: 'numeric' }) : 'N/A'}
                        </span>
                        {medicine.expiryDate && new Date(medicine.expiryDate) < new Date() && (
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter mt-0.5">Expired</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-slate-800">${(medicine.sellingPrice ?? 0).toFixed(2)}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">per unit</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-[11px] font-black uppercase ${medicine.currentStock === 0 ? 'text-red-600' : medicine.currentStock! < (medicine.reorderLevel || 50) ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {medicine.currentStock} Units
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 italic">Min: {medicine.reorderLevel || 50}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              medicine.currentStock === 0 ? 'w-0' : 
                              medicine.currentStock! < (medicine.reorderLevel || 50) ? 'bg-orange-500 w-1/4' : 'bg-emerald-500 w-[85%]'
                            }`}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedMedicine({ id: medicine.id, name: medicine.name })}
                          className="px-3 py-1.5 rounded-lg bg-orange-700 text-white text-[10px] font-black uppercase hover:bg-orange-800 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[14px]">swap_vert</span>
                          Stock
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddMedicineModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchInventory}
        />
      )}

      {selectedMedicine && (
        <StockUpdateModal 
          itemId={selectedMedicine.id}
          itemName={selectedMedicine.name}
          onClose={() => setSelectedMedicine(null)}
          onSuccess={fetchInventory}
        />
      )}
    </MainLayout>
  );
}
