'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';
import EmptyState from '@/modules/pharmacy/components/EmptyState';
import AddMedicineModal from '@/modules/pharmacy/pages/AddMedicineModal';

export default function StockPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getInventory({ search: searchTerm });
      if (response.success && response.data) {
        setMedicines(response.data.content);
      } else {
        // Mock data for demo if API fails
        setMedicines([
          { id: '1', name: 'Amoxicillin 500mg', form: 'Capsule', batchNumber: 'AMX-2023-014', expiryDate: '2025-10-12', unitPrice: 12.5, stockQuantity: 450, category: 'Antibiotics' },
          { id: '2', name: 'Lisinopril 10mg', form: 'Tablet', batchNumber: 'LIS-B92-X0', expiryDate: '2024-08-15', unitPrice: 8.2, stockQuantity: 12, category: 'Cardiovascular' },
          { id: '3', name: 'Metformin 850mg', form: 'Tablet', batchNumber: 'MET-2023-991', expiryDate: '2026-11-30', unitPrice: 14, stockQuantity: 0, category: 'Analgesics' },
        ]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchTerm]);

  return (
    <MainLayout title="Medicine Master Inventory">
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Stock Management</h2>
            <p className="text-[var(--text-secondary)] mt-1">Manage clinical stock levels, batch expiries, and unit pricing.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            Add Medicine
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
            <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider">Total Items</p>
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-2">{medicines.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
            <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider">Low Stock</p>
            <h3 className="text-3xl font-bold text-orange-600 mt-2">{medicines.filter(m => m.stockQuantity > 0 && m.stockQuantity < 20).length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
            <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-3xl font-bold text-red-600 mt-2">{medicines.filter(m => m.stockQuantity === 0).length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
            <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider">Inventory Value</p>
            <h3 className="text-3xl font-bold text-blue-600 mt-2">
              ${medicines.reduce((acc, m) => acc + (m.unitPrice * m.stockQuantity), 0).toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border-none rounded-xl text-sm outline-none" 
                placeholder="Search medicine, batch number, or category..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Medicine Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Batch</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Expiry</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={6} className="p-8"><LoadingSkeleton /></td></tr>
              ) : medicines.length === 0 ? (
                <tr><td colSpan={6} className="p-8"><EmptyState message="No inventory found" /></td></tr>
              ) : (
                medicines.map((medicine) => (
                  <tr key={medicine.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${medicine.stockQuantity === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                          <span className="material-symbols-outlined text-sm">pill</span>
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{medicine.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{medicine.form} • {medicine.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-[var(--text-secondary)]">{medicine.batchNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${new Date(medicine.expiryDate) < new Date() ? 'text-red-600 font-bold' : 'text-[var(--text-primary)]'}`}>
                        {new Date(medicine.expiryDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">${medicine.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${medicine.stockQuantity === 0 ? 'text-red-600' : medicine.stockQuantity < 20 ? 'text-orange-600' : 'text-[var(--text-primary)]'}`}>
                          {medicine.stockQuantity} Units
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${medicine.stockQuantity === 0 ? 'bg-red-600 w-0' : medicine.stockQuantity < 20 ? 'bg-orange-400 w-1/4' : 'bg-orange-600 w-3/4'}`}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[var(--text-secondary)] hover:text-orange-600 transition-colors">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
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
    </MainLayout>
  );
}
