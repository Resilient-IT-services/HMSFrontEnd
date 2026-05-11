'use client';
import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';
import EmptyState from '@/modules/pharmacy/components/EmptyState';
import QuickStockAddModal from '@/modules/pharmacy/components/QuickStockAddModal';
import MedicineViewModal from '@/modules/pharmacy/components/MedicineViewModal';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { PharmacyStockDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';

export default function StockPage() {
  const [medicines, setMedicines] = useState<PharmacyStockDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedMedicineForStock, setSelectedMedicineForStock] = useState<{ id: string; name: string } | null>(null);
  const [selectedMedicineForView, setSelectedMedicineForView] = useState<{ id: string; name: string } | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getMedicineStock({ 
        size: 20, 
        page, 
        search: debouncedSearch,
        lowStock: statusFilter === 'LOW_STOCK'
      });
      if (response.success && response.data) {
        setMedicines(response.data.content || []);
        setTotalElements(response.data.totalElements);
      } else {
        setMedicines([]);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Fetch Inventory Error:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Reset page on search or filter change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  const handleExport = () => {
    if (medicines.length === 0) {
        triggerGlobalToast('No data available to export', 'error');
        return;
    }
    
    const headers = ['Medicine Name', 'Batch', 'Expiry Date', 'Quantity', 'Price (₹)'];
    const csvContent = [
      headers.join(','),
      ...medicines.map(m => [
        `"${m.medicineName}"`,
        `"${m.batchNumber}"`,
        `"${m.expiryDate}"`,
        m.quantity,
        m.price
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx, .xls';
    input.addEventListener('change', async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setImporting(true);
        const response = await pharmacyApi.importStock(file);
        if (response.success) {
          triggerGlobalToast('Stock imported successfully', 'success');
          fetchInventory();
        }
      } catch (error) {
        console.error('Import failed', error);
      } finally {
        setImporting(false);
      }
    });
    input.click();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!globalThis.confirm(`Are you sure you want to delete "${name}"? This will remove all stock records for this specific batch.`)) return;

    try {
      setLoading(true);
      const response = await pharmacyApi.deleteMedicine(id); 
      if (response.success) {
        setMedicines(prev => prev.filter(m => m.id !== id));
        triggerGlobalToast('Record deleted', 'success');
      }
    } catch (error) {
      console.error('Delete failed', error);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations (Based on current page or total)
  const totalProductsCount = totalElements; // Approximate for now
  const totalStockUnits = medicines.reduce((acc, m) => acc + (m.quantity || 0), 0);
  const lowStockCount = medicines.filter(m => (m.quantity || 0) > 0 && (m.quantity || 0) < 50).length;
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expDate = new Date(m.expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expDate < thirtyDaysFromNow;
  }).length;

  return (
    <MainLayout title="Inventory Management" hideTitle>
      <div className="space-y-section-gap">
        {/* Page Header */}
        <div className="flex justify-between items-end">
            <div>
                <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-tighter">Inventory Management</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Real-time stock monitoring and distribution control.</p>
            </div>
            <div className="flex gap-3">
                <button 
                  onClick={handleImportClick}
                  disabled={importing}
                  className="px-5 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl font-label-md text-label-md text-on-surface flex items-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-[18px]">{importing ? 'sync' : 'publish'}</span>
                    {importing ? 'Importing...' : 'Import Stock'}
                </button>
                <Link 
                  href="/pharmacy/batch-entry"
                  className="px-5 py-2.5 bg-primary-container text-on-primary rounded-xl font-label-md text-label-md flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">inventory</span>
                    Add Stock
                </Link>
            </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">medical_services</span>
                </div>
                <div>
                    <p className="font-label-md text-label-md text-on-surface-variant">Total Batches</p>
                    <h3 className="font-headline-xl text-headline-xl text-on-surface leading-tight">{totalProductsCount.toLocaleString()}</h3>
                </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">inventory</span>
                </div>
                <div>
                    <p className="font-label-md text-label-md text-on-surface-variant">Total Units (Page)</p>
                    <h3 className="font-headline-xl text-headline-xl text-on-surface leading-tight">{totalStockUnits.toLocaleString()}</h3>
                </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl text-[#a83900]">warning</span>
                </div>
                <div>
                    <p className="font-label-md text-label-md text-on-surface-variant">Low Stock (Page)</p>
                    <h3 className="font-headline-xl text-headline-xl text-on-surface leading-tight text-orange-600">{lowStockCount}</h3>
                </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-3xl">event_busy</span>
                </div>
                <div>
                    <p className="font-label-md text-label-md text-on-surface-variant">Expiring Soon (Page)</p>
                    <h3 className="font-headline-xl text-headline-xl text-on-surface leading-tight text-error">{expiringSoonCount}</h3>
                </div>
            </div>
        </div>

        {/* Main Inventory Table Section */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            {/* Table Controls */}
            <div className="p-6 border-b border-outline-variant flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-full max-w-sm">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                        <input 
                          className="pl-10 pr-4 py-2.5 w-full bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container text-body-md transition-all outline-none" 
                          placeholder="Search by medicine name or batch..." 
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-outline-variant rounded-xl text-on-surface font-label-md bg-white outline-none hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                        <option value="ALL">All Inventory</option>
                        <option value="LOW_STOCK">Low Stock</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={handleExport}
                      className="px-4 py-2.5 border border-outline-variant rounded-xl text-on-surface font-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export CSV
                    </button>
                </div>
            </div>
            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-on-surface-variant">
                    <tr>
                        <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">Product Information</th>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Batch & Expiry</th>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Inventory Levels</th>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right">Unit Price (₹)</th>
                        <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-center">Status</th>
                        <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant font-body-md text-body-md bg-white">
                      {loading ? (
                        <tr><td colSpan={6} className="p-20 text-center"><LoadingSkeleton /></td></tr>
                      ) : medicines.length === 0 ? (
                        <tr><td colSpan={6} className="p-20"><EmptyState message="No inventory found matching your criteria." /></td></tr>
                      ) : (
                        medicines.map((m) => (
                          <tr key={m.id} className="hover:bg-primary/5 transition-all group">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant group-hover:border-primary/30 group-hover:bg-primary/10 transition-all">
                                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-2xl">medication</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-on-surface text-base leading-tight group-hover:text-primary transition-colors">{m.medicineName}</p>
                                        <p className="text-[11px] text-on-surface-variant font-bold uppercase mt-1 opacity-70 truncate max-w-[200px]">
                                          ID: {m.medicineId.split('-')[0]}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="space-y-1">
                                    <p className="font-mono text-xs font-black text-on-surface tracking-tighter bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                      {m.batchNumber || 'NO_BATCH'}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant">calendar_today</span>
                                        <span className={m.expiryDate && new Date(m.expiryDate) < new Date() ? 'text-error font-black' : 'text-on-surface-variant'}>
                                          {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="space-y-2 max-w-[140px]">
                                    <div className="flex items-end justify-between">
                                        <p className="text-xl font-black text-on-surface leading-none tracking-tighter">{m.quantity || 0}</p>
                                        <p className="text-[10px] text-on-surface-variant font-black uppercase opacity-50 tracking-tighter">Units Available</p>
                                    </div>
                                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-outline-variant/30">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                            (m.quantity || 0) === 0 ? 'w-0' : 
                                            (m.quantity || 0) < 50 ? 'bg-orange-500 w-1/3 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-green-500 w-[85%] shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                                          }`}
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                                <p className="text-lg font-black text-on-surface tracking-tighter">₹ {m.price?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-0.5 opacity-50">M.R.P per unit</p>
                            </td>
                            <td className="px-6 py-5 text-center">
                                {(m.quantity || 0) === 0 ? (
                                  <div className="inline-flex flex-col items-center gap-1">
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-200 shadow-sm">Out of Stock</span>
                                  </div>
                                ) : (m.quantity || 0) < 50 ? (
                                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">Low Stock</span>
                                ) : (
                                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-700 border border-green-200 shadow-sm">In Stock</span>
                                )}
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => setSelectedMedicineForStock({ id: m.medicineId, name: m.medicineName })}
                                      className="p-3 bg-white border border-outline-variant rounded-2xl text-on-surface-variant hover:text-orange-600 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100 transition-all active:scale-90"
                                      title="Increase Stock"
                                    >
                                      <span className="material-symbols-outlined text-[22px]">add_circle</span>
                                    </button>
                                    <button 
                                      onClick={() => setSelectedMedicineForView({ id: m.medicineId, name: m.medicineName })}
                                      className="p-3 bg-white border border-outline-variant rounded-2xl text-on-surface-variant hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all active:scale-90"
                                      title="View Product Profile"
                                    >
                                      <span className="material-symbols-outlined text-[22px]">visibility</span>
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(m.id, m.medicineName)}
                                      className="p-3 bg-white border border-outline-variant rounded-2xl text-on-surface-variant hover:text-red-600 hover:border-red-200 hover:shadow-lg hover:shadow-red-100 transition-all active:scale-90"
                                      title="Remove Entry"
                                    >
                                      <span className="material-symbols-outlined text-[22px]">delete_sweep</span>
                                    </button>
                                </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                </table>
            </div>
            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-outline-variant flex flex-wrap items-center justify-between gap-4">
                <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">
                  Showing {page * 20 + 1} to {Math.min((page + 1) * 20, totalElements)} of {totalElements} Batch Records
                </p>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 bg-white border border-outline-variant rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button className="w-10 h-10 bg-slate-900 text-white rounded-xl font-black text-sm shadow-lg shadow-slate-200">{page + 1}</button>
                    <button 
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * 20 >= totalElements}
                      className="px-4 py-2 bg-white border border-outline-variant rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                </div>
            </div>
        </div>

        {/* Analytics Section stays same but with updated spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter pb-margin-page">
            <div className="bg-white border border-outline-variant p-8 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-black tracking-tighter">Movement Analytics</h4>
                    <div className="flex gap-2">
                         <div className="w-3 h-3 rounded-full bg-primary"></div>
                         <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
                    </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-4 px-2">
                    <div className="w-full bg-slate-100 rounded-2xl hover:bg-primary/20 transition-colors" style={{ height: '60%' }}></div>
                    <div className="w-full bg-slate-900 rounded-2xl hover:opacity-80 transition-colors shadow-lg" style={{ height: '85%' }}></div>
                    <div className="w-full bg-slate-100 rounded-2xl hover:bg-primary/20 transition-colors" style={{ height: '45%' }}></div>
                    <div className="w-full bg-slate-900 rounded-2xl hover:opacity-80 transition-colors shadow-lg" style={{ height: '70%' }}></div>
                    <div className="w-full bg-slate-100 rounded-2xl hover:bg-primary/20 transition-colors" style={{ height: '55%' }}></div>
                    <div className="w-full bg-slate-900 rounded-2xl hover:opacity-80 transition-colors shadow-lg" style={{ height: '95%' }}></div>
                    <div className="w-full bg-slate-100 rounded-2xl hover:bg-primary/20 transition-colors" style={{ height: '75%' }}></div>
                </div>
                <div className="flex justify-between mt-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
            </div>
            <div className="bg-white border border-outline-variant p-8 rounded-3xl shadow-sm">
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-black tracking-tighter mb-8">Activity Stream</h4>
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-1.5 h-12 bg-green-500 rounded-full mt-1"></div>
                        <div className="flex-1">
                            <p className="font-black text-sm text-slate-800">New batch registered</p>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Amoxicillin • Batch #AMX-01 • 5m ago</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 opacity-60">
                        <div className="w-1.5 h-12 bg-orange-500 rounded-full mt-1"></div>
                        <div className="flex-1">
                            <p className="font-black text-sm text-slate-800">Inventory threshold reached</p>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Paracetamol • 12 units left • 1h ago</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Floating Scanner Action */}
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-slate-900 text-white rounded-[24px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group">
          <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">qr_code_scanner</span>
      </button>

      {/* Enhanced Modals */}
      {selectedMedicineForStock && (
        <QuickStockAddModal 
          medicineId={selectedMedicineForStock.id}
          medicineName={selectedMedicineForStock.name}
          currentStock={medicines.find(m => m.medicineId === selectedMedicineForStock.id)?.quantity || 0}
          onClose={() => setSelectedMedicineForStock(null)}
          onSuccess={fetchInventory}
        />
      )}

      {selectedMedicineForView && (
        <MedicineViewModal 
          medicineId={selectedMedicineForView.id}
          onClose={() => setSelectedMedicineForView(null)}
        />
      )}
    </MainLayout>
  );
}
