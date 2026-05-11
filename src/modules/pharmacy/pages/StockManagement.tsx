'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import QuickStockAddModal from '@/modules/pharmacy/components/QuickStockAddModal';
import MedicineViewModal from '@/modules/pharmacy/components/MedicineViewModal';
import { PharmacyStockDTO } from '@/types/api';
import { usePharmacyStock } from '@/modules/pharmacy/hooks/usePharmacyStock';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';

export const StockManagement = () => {
  const {
    medicines,
    loading,
    importing,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalElements,
    selectedMedicineForStock,
    setSelectedMedicineForStock,
    selectedMedicineForView,
    setSelectedMedicineForView,
    handleExport,
    handleImport,
    handleDelete,
    refresh,
    stats
  } = usePharmacyStock();

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx, .xls';
    input.addEventListener('change', async (e: any) => {
      const file = e.target.files[0];
      if (file) handleImport(file);
    });
    input.click();
  };

  const columns: Column<PharmacyStockDTO>[] = [
    {
      header: 'Product Information',
      render: (m) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-orange-600 transition-colors">
            <span className="material-symbols-outlined text-xl">medication</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight group-hover:text-orange-700 transition-colors">{m.medicineName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5 opacity-70">
              ID: {m.medicineId.split('-')[0]}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Batch & Expiry',
      render: (m) => (
        <div className="space-y-1">
          <p className="font-mono text-[10px] font-black text-slate-700 tracking-tighter bg-slate-100 px-2 py-0.5 rounded inline-block">
            {m.batchNumber || 'NO_BATCH'}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <span className="material-symbols-outlined text-[12px] text-slate-400">calendar_today</span>
            <span className={m.expiryDate && new Date(m.expiryDate) < new Date() ? 'text-red-600 font-black' : 'text-slate-500'}>
              {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Levels',
      render: (m) => (
        <div className="space-y-1.5 min-w-[100px]">
          <div className="flex items-end justify-between">
            <p className="text-base font-black text-slate-900 leading-none tracking-tighter">{m.quantity || 0}</p>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Units</p>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                (m.quantity || 0) === 0 ? 'w-0' : 
                (m.quantity || 0) < 50 ? 'bg-orange-500 w-1/3' : 'bg-emerald-500 w-[85%]'
              }`}
            />
          </div>
        </div>
      )
    },
    {
      header: 'Unit Price',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (m) => (
        <div>
          <p className="text-sm font-black text-slate-900 tracking-tighter">₹ {m.price?.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight opacity-50">M.R.P</p>
        </div>
      )
    },
    {
      header: 'Status',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (m) => {
        if ((m.quantity || 0) === 0) return <Badge variant="red">Out of Stock</Badge>;
        if ((m.quantity || 0) < 50) return <Badge variant="orange">Low Stock</Badge>;
        return <Badge variant="emerald">In Stock</Badge>;
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button 
            variant="secondary" 
            size="sm" 
            icon="add_circle" 
            className="w-8 h-8 p-0"
            onClick={() => setSelectedMedicineForStock({ id: m.medicineId, name: m.medicineName })}
            title="Increase Stock"
          />
          <Button 
            variant="secondary" 
            size="sm" 
            icon="visibility" 
            className="w-8 h-8 p-0"
            onClick={() => setSelectedMedicineForView({ id: m.medicineId, name: m.medicineName })}
            title="View Profile"
          />
          <Button 
            variant="danger" 
            size="sm" 
            icon="delete" 
            className="w-8 h-8 p-0"
            onClick={() => handleDelete(m.id, m.medicineName)}
            title="Remove Entry"
          />
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Inventory Management" hideTitle>
      <div className="p-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f8f9fc] min-h-screen font-inter">
        
        <PageHeading 
          title="Stock Inventory" 
          description="Real-time pharmaceutical stock monitoring and batch distribution control."
        >
          <Button 
            variant="secondary" 
            icon={importing ? 'sync' : 'publish'} 
            onClick={handleImportClick} 
            disabled={importing}
            isLoading={importing}
          >
            Import CSV
          </Button>
          <Button icon="inventory" href="/pharmacy/batch-entry">
            Add Batch Stock
          </Button>
        </PageHeading>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard label="Total Batches" value={stats.totalElements} icon="medical_services" variant="slate" />
          <MetricCard label="Total Units" value={stats.totalStockUnits} icon="inventory" variant="blue" />
          <MetricCard label="Low Stock Items" value={stats.lowStockCount} icon="warning" variant="orange" subValue="Requires Reorder" />
          <MetricCard label="Expiring Soon" value={stats.expiringSoonCount} icon="event_busy" variant="purple" subValue="Next 30 Days" />
        </div>

        {/* Inventory Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          {/* Table Toolbar */}
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-full max-w-sm">
                <SearchInput 
                  placeholder="Search medicine name or batch..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-none bg-white rounded-xl text-slate-700 font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors cursor-pointer outline-none min-w-[160px]"
              >
                <option value="ALL">All Inventory</option>
                <option value="LOW_STOCK">Low Stock Only</option>
              </select>
            </div>
            <Button variant="secondary" icon="download" onClick={handleExport}>Export CSV</Button>
          </div>

          <Table 
            columns={columns} 
            data={medicines} 
            isLoading={loading}
            emptyMessage="No inventory found matching your criteria."
          />

          <Pagination 
            page={page} 
            totalElements={totalElements} 
            pageSize={20}
            onPageChange={setPage} 
            label="batch records"
          />
        </div>

        {/* Secondary Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-manrope text-xl font-black text-slate-900 tracking-tight">Movement Analytics</h4>
              <Badge variant="blue">Weekly View</Badge>
            </div>
            <div className="h-48 flex items-end justify-between gap-4 px-2">
              {[60, 85, 45, 70, 55, 95, 75].map((h, i) => (
                <div key={i} className={`w-full rounded-xl transition-all ${i % 2 === 0 ? 'bg-slate-100 hover:bg-orange-200' : 'bg-slate-900 hover:opacity-80 shadow-lg'}`} style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="flex justify-between mt-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
            <h4 className="font-manrope text-xl font-black text-slate-900 tracking-tight mb-8">Recent Activity</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-1.5 h-12 bg-emerald-500 rounded-full mt-1"></div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Stock replenishment successful</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Amoxicillin • Batch #AMX-01 • 5m ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-1.5 h-12 bg-orange-500 rounded-full mt-1"></div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Inventory threshold warning</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Paracetamol • 12 units left • 1h ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4 opacity-50">
                <div className="w-1.5 h-12 bg-blue-500 rounded-full mt-1"></div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Bulk export completed</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">System User • CSV Format • 3h ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Scan Action */}
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-slate-900 text-white rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 hover:-rotate-6 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined text-3xl group-hover:text-orange-500">qr_code_scanner</span>
      </button>

      {/* Modals */}
      {selectedMedicineForStock && (
        <QuickStockAddModal 
          medicineId={selectedMedicineForStock.id}
          medicineName={selectedMedicineForStock.name}
          currentStock={medicines.find(m => m.medicineId === selectedMedicineForStock.id)?.quantity || 0}
          onClose={() => setSelectedMedicineForStock(null)}
          onSuccess={refresh}
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
};
