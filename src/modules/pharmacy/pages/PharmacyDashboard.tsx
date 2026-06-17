'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '../api/pharmacyApi';
import { PrescriptionResponse, PharmacyStockDTO } from '@/types/api';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { Table, Column } from '@/components/ui/Table';
import { PageSurface } from '@/components/ui/PageSurface';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { MetricCard } from '@/components/ui/MetricCard';
import { 
  FileText, Hourglass, CheckCircle2, AlertTriangle, Calendar, 
  IndianRupee, Plus, Search, PlusCircle, Download, 
  ArrowRight, Eye, Activity
} from 'lucide-react';

import dayjs from 'dayjs';

export const PharmacyDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [recentSalesData, setRecentSalesData] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<PharmacyStockDTO[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState({
    totalPrescriptionsToday: 0,
    pendingPrescriptions: 0,
    completedPrescriptions: 0,
    cancelledPrescriptions: 0,
    lowStockCount: 0,
    expiringCount: 0,
    todayRevenue: 0,
    totalBatches: 0,
    totalMedicines: 0
  });

  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setStatsError(null);

      const today = dayjs().startOf('day');
      const thirtyDaysFromNow = dayjs().add(30, 'day').endOf('day');

      const [pendingRes, dispensedRes, cancelledRes, stockRes, statsRes] = await Promise.allSettled([
        pharmacyApi.getPrescriptions({ status: 'PENDING', size: 100 }),
        pharmacyApi.getPrescriptions({ status: 'DISPENSED', size: 100 }),
        pharmacyApi.getPrescriptions({ status: 'CANCELLED', size: 100 }),
        pharmacyApi.getMedicineStock({ size: 1000 }),
        pharmacyApi.getDashboardStats()
      ]);

      let pendingList: PrescriptionResponse[] = [];
      let pendingCount = 0;
      let completedCount = 0;
      let cancelledCount = 0;
      let revenue = 0;
      let allStock: PharmacyStockDTO[] = [];
      let dispensedList: PrescriptionResponse[] = [];
      let recentSales: any[] = [];
      
      let apiLowStockCount = 0;
      let apiExpiringSoonCount = 0;
      let apiTotalBatches = 0;
      let apiTotalMedicines = 0;

      // 0. PROCESS STATS
      if (statsRes.status === 'fulfilled' && statsRes.value.success && statsRes.value.data) {
        const s = statsRes.value.data;
        apiLowStockCount = s.lowStockCount;
        apiExpiringSoonCount = s.expiringSoonCount;
        apiTotalBatches = s.totalBatches;
        apiTotalMedicines = s.totalMedicines;
      } else if (statsRes.status === 'rejected' || (statsRes.status === 'fulfilled' && !statsRes.value.success)) {
        setStatsError('Failed to fetch some dashboard statistics');
      }

      // 1. PROCESS PRESCRIPTIONS & REVENUE
      if (pendingRes.status === 'fulfilled' && pendingRes.value.success) {
        const rawPending = (pendingRes.value.data?.content as unknown as PrescriptionResponse[]) || [];
        // Filter out prescriptions with 0 items
        pendingList = rawPending.filter(p => (p.items?.length || 0) > 0);
        pendingCount = pendingList.length; // Use local count for accurate dashboard metrics
      }
      
      if (dispensedRes.status === 'fulfilled' && dispensedRes.value.success) {
        dispensedList = (dispensedRes.value.data?.content as unknown as PrescriptionResponse[]) || [];
        completedCount = dispensedRes.value.data?.totalElements || dispensedList.length;
      }

      // Fetch all sales (Visit + Walk-in) for today to calculate revenue and recent billing
      const allSalesRes = await pharmacyApi.getSales({ size: 50, sort: 'createdAt,desc' });
      if (allSalesRes.success && allSalesRes.data) {
        const todaySales = allSalesRes.data.content.filter(s => dayjs(s.createdAt).isSame(today, 'day'));
        revenue = todaySales.reduce((acc, sale) => acc + (Number(sale.totalAmount || 0)), 0);
        recentSales = todaySales;
      }

      if (cancelledRes.status === 'fulfilled' && cancelledRes.value.success) {
        cancelledCount = cancelledRes.value.data?.totalElements || 0;
      }

      // 2. PROCESS STOCK (INVENTORY ALERTS)
      if (stockRes.status === 'fulfilled' && stockRes.value.success) {
        allStock = stockRes.value.data?.content || [];
      }
      const lowStockList = allStock.filter(m => {
        const qty = Number(m.quantity || 0);
        const threshold = Number(m.reorderLevel || 50);
        return qty > 0 && qty < threshold;
      });
      const expiringSoonList = allStock.filter(m => {
        if (!m.expiryDate) return false;
        const expDate = dayjs(m.expiryDate);
        return expDate.isAfter(today.subtract(1, 'day')) && expDate.isBefore(thirtyDaysFromNow);
      });

      // 3. UPDATE STATES
      setRecentSalesData(recentSales.slice(0, 3));
      setPrescriptions(pendingList);
      setLowStockAlerts(lowStockList.slice(0, 3));
      setMetrics({
        totalPrescriptionsToday: pendingCount + completedCount + cancelledCount,
        pendingPrescriptions: pendingCount,
        completedPrescriptions: completedCount,
        cancelledPrescriptions: cancelledCount,
        lowStockCount: apiLowStockCount || lowStockList.length,
        expiringCount: apiExpiringSoonCount || expiringSoonList.length,
        todayRevenue: revenue,
        totalBatches: apiTotalBatches,
        totalMedicines: apiTotalMedicines
      });

    } catch (error) {
      console.error('Pharmacy Dashboard - Unexpected Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const trigger = async () => {
      await fetchDashboardData(false);
    };
    void trigger();
  }, [fetchDashboardData]);

  const handleImportExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx, .xls';
    input.addEventListener('change', async (event: Event) => {
      const inputElement = event.target as HTMLInputElement;
      const file = inputElement.files?.[0];
      if (file) {
        setImporting(true);
        try {
          const res = await pharmacyApi.importStock(file);
          if (res.success) {
            triggerGlobalToast('Stock imported successfully', 'success');
            void fetchDashboardData(true);
          } else {
            triggerGlobalToast(res.message || 'Import failed', 'error');
          }
        } catch (error) {
          console.error('Import Error:', error);
          triggerGlobalToast('An error occurred during import', 'error');
        } finally {
          setImporting(false);
        }
      }
    });
    input.click();
  };

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const filteredPrescriptions = useMemo(() => {
    let result = prescriptions;
    
    // Global search
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((p) => 
        p.patientName?.toLowerCase().includes(term) ||
        p.id?.toString().toLowerCase().includes(term) ||
        p.patientCode?.toLowerCase().includes(term)
      );
    }

    // Column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (!value) return;
      const lowerValue = value.toLowerCase();
      
      switch (key) {
        case 'id':
        case 'Rx Ref': {
          result = result.filter(p => p.id?.toString().toLowerCase().includes(lowerValue));
          break;
        }
        case 'patientName':
        case 'Patient': {
          result = result.filter(p => p.patientName?.toLowerCase().includes(lowerValue));
          break;
        }
        case 'doctorName':
        case 'Doctor': {
          result = result.filter(p => p.doctorName?.toLowerCase().includes(lowerValue));
          break;
        }
        case 'status':
        case 'Status': {
          result = result.filter(p => p.status?.toLowerCase() === lowerValue);
          break;
        }
      }
    });

    return result;
  }, [prescriptions, searchTerm, columnFilters]);

  const prescriptionColumns: Column<PrescriptionResponse>[] = [
    {
      header: 'Rx Ref',
      key: 'id',
      filterable: true,
      filterPlaceholder: 'Rx Ref...',
      render: (p) => (
        <span className="font-semibold text-slate-800">
          #{p.id?.toString().slice(-6).toUpperCase() || 'N/A'}
        </span>
      )
    },
    {
      header: 'Patient',
      key: 'patientName',
      filterable: true,
      filterPlaceholder: 'Patient name...',
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-800">{p.patientName}</p>
          <p className="text-[10px] text-slate-400 font-normal">PID: P-{p.id?.toString().slice(-4).toUpperCase() || 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'Doctor',
      key: 'doctorName',
      filterable: true,
      filterPlaceholder: 'Doctor...',
      render: (p) => (
        <div>
          <p className="text-slate-700">{p.doctorName || 'N/A'}</p>
          <p className="text-[10px] text-slate-400 font-normal">CareFlow Physician</p>
        </div>
      )
    },
    {
      header: 'Items',
      render: (p) => <span className="font-semibold">{p.items?.length || 0} Items</span>,
    },
    {
      header: 'Status',
      key: 'status',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Dispensed', value: 'DISPENSED' },
        { label: 'Completed', value: 'COMPLETED' }
      ],
      render: (p) => (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
          p.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 
          p.status === 'DISPENSED' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {p.status || 'PENDING'}
        </span>
      ),
    },
    {
      header: 'Time',
      render: (p) => <span className="text-slate-500">{new Date(p.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    },
    {
      header: 'Action',
      render: (p) => (
        <Link href={`/pharmacy/sales?prescriptionId=${p.id}`}>
          <button className="text-slate-400 hover:text-slate-600">
            <Eye className="w-4 h-4 mx-auto" />
          </button>
        </Link>
      ),
      className: 'text-center'
    }
  ];

  return (
    <MainLayout title="Pharmacy Overview" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#F8FAFC]"
        fontClassName="font-inter"
      >
        <div className="space-y-6 p-4 md:p-8">
          
          {/* WELCOME SECTION & QUICK ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Welcome back, {user?.fullName || 'Pharmacist'}! </h1>
              <p className="text-sm text-slate-500 mt-0.5">Here&apos;s what&apos;s happening in your pharmacy today.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/pharmacy/sales">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold rounded-lg hover:bg-blue-100 transition-all">
                  <Plus className="w-3.5 h-3.5" /> New Billing
                </button>
              </Link>
              <Link href="/pharmacy/prescriptions">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all">
                  <Search className="w-3.5 h-3.5" /> Search Rx
                </button>
              </Link>
              <Link href="/pharmacy/batch-entry">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-all">
                  <PlusCircle className="w-3.5 h-3.5" /> Add Stock
                </button>
              </Link>
              <button 
                onClick={handleImportExcel}
                disabled={importing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-100 text-xs font-bold rounded-lg hover:bg-purple-100 transition-all disabled:opacity-50"
              >
                {importing ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Import Excel
              </button>
              <Link href="/pharmacy/reports">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold rounded-lg hover:bg-orange-100 transition-all">
                  <FileText className="w-3.5 h-3.5" /> Generate Report
                </button>
              </Link>
            </div>
          </div>

          {statsError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {statsError}
            </div>
          )}

          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Total Prescriptions<br/>Today</p>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : metrics.totalPrescriptionsToday}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Pending Prescriptions<br/>Today</p>
                <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Hourglass className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : metrics.pendingPrescriptions}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Completed<br/>Today</p>
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : metrics.completedPrescriptions}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Total<br/>Medicines</p>
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Activity className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : metrics.totalMedicines}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Total<br/>Stock Batches</p>
                <span className="p-1.5 bg-slate-50 text-slate-600 rounded-lg"><PlusCircle className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : metrics.totalBatches}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Low Stock<br/>Medicines</p>
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : (metrics.lowStockCount < 10 && metrics.lowStockCount > 0 ? `0${metrics.lowStockCount}` : metrics.lowStockCount)}</h3>
                <Link href="/pharmacy/stock?status=LOW_STOCK" className="text-[11px] text-orange-600 font-bold flex items-center gap-0.5 mt-1 hover:underline">
                  View details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Expiring<br/>Soon</p>
                <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : metrics.expiringCount}</h3>
                <Link href="/pharmacy/stock?status=EXPIRING_SOON" className="text-[11px] text-orange-600 font-bold flex items-center gap-0.5 mt-1 hover:underline">
                  View details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Revenue<br/>Today</p>
                <span className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><IndianRupee className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : `₹${metrics.todayRevenue.toLocaleString('en-IN')}`}</h3>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: PRESCRIPTION QUEUE (EXPANDED) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 min-h-[600px] flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-800">Prescription Queue</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative text-xs w-48">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search Patient, Rx..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none" 
                      />
                    </div>
                    <Link href="/pharmacy/prescriptions" className="hidden sm:inline-block text-xs font-bold text-blue-600 hover:underline ml-1">View all</Link>
                  </div>
                </div>
                <div className="overflow-x-auto min-w-full flex-1">
                  <Table
                    columns={prescriptionColumns} 
                    data={filteredPrescriptions} 
                    isLoading={loading}
                    emptyMessage="No pending prescriptions."
                    onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                    activeFilters={columnFilters}
                  />

                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: WIDGETS */}
            <div className="space-y-6">
              {/* LOW STOCK ALERTS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800">Low Stock Alerts</h3>
                </div>
                <div className="space-y-2.5 flex-1 mt-1">
                  {lowStockAlerts.length > 0 ? lowStockAlerts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-rose-500 rounded-sm"></span>
                        <span className="font-medium text-slate-700">{item.medicineName}</span>
                      </div>
                      <span className="font-bold text-rose-600">{item.quantity} Left</span>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="text-xs font-medium">All items well stocked</p>
                    </div>
                  )}
                </div>
                <Link href="/pharmacy/stock?status=LOW_STOCK">
                  <button className="w-full py-2 bg-orange-50 text-orange-600 text-xs font-bold rounded-xl mt-3 hover:bg-orange-100 transition-all flex items-center justify-center gap-1">
                    Go to Stock Inventory <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>

              {/*/!* EXPIRY ALERTS *!/*/}
              {/*<div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">*/}
              {/*  <div className="flex items-center justify-between mb-3">*/}
              {/*    <h3 className="text-sm font-bold text-slate-800">Expiry Alerts</h3>*/}
              {/*  </div>*/}
              {/*  <div className="space-y-2.5 flex-1 mt-1">*/}
              {/*    {expiryAlerts.length > 0 ? expiryAlerts.map((item, idx) => (*/}
              {/*      <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50">*/}
              {/*        <div className="flex items-center gap-2">*/}
              {/*          <span className="w-1.5 h-3 bg-purple-500 rounded-sm"></span>*/}
              {/*          <span className="font-medium text-slate-700">{item.medicineName}</span>*/}
              {/*        </div>*/}
              {/*        <span className="font-bold text-purple-600">{dayjs(item.expiryDate).format('DD MMM')}</span>*/}
              {/*      </div>*/}
              {/*    )) : (*/}
              {/*      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-4">*/}
              {/*        <CheckCircle2 className="w-8 h-8 text-emerald-500" />*/}
              {/*        <p className="text-xs font-medium">No items expiring soon</p>*/}
              {/*      </div>*/}
              {/*    )}*/}
              {/*  </div>*/}
              {/*  <Link href="/pharmacy/stock?status=EXPIRING_SOON">*/}
              {/*    <button className="w-full py-2 bg-purple-50 text-purple-600 text-xs font-bold rounded-xl mt-3 hover:bg-purple-100 transition-all flex items-center justify-center gap-1">*/}
              {/*      Go to Stock Inventory <ArrowRight className="w-3.5 h-3.5" />*/}
              {/*    </button>*/}
              {/*  </Link>*/}
              {/*</div>*/}

              {/* TODAY'S PERFORMANCE Pie Chart */}
              <MetricCard 
                label="Today's Performance"
                layout="chart"
                chartData={{
                  pending: metrics.pendingPrescriptions,
                  completed: metrics.completedPrescriptions,
                  cancelled: metrics.cancelledPrescriptions
                }}
                subValue={`${Math.round((metrics.completedPrescriptions / (metrics.totalPrescriptionsToday || 1)) * 100)}% Dispense Rate`}
              />

              {/* RECENT BILLING */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800">Recent Billing</h3>
                </div>
                <div className="space-y-3 text-xs">
                  {recentSalesData.length > 0 ? recentSalesData.map((sale: any, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-slate-800">
                          {sale.invoiceNumber || sale.billNo || `BILL-${sale.id?.slice(-6).toUpperCase() || idx}`}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {sale.customerName || sale.patientName || 'Walk-in'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">₹{Number(sale.netAmount || sale.totalAmount || sale.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-slate-400">
                          {sale.date || sale.createdAt ? dayjs(sale.date || sale.createdAt).format('hh:mm A') : 'Completed'}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-6 text-center">
                      <p className="text-slate-400 italic">No bills generated today</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </PageSurface>
    </MainLayout>
  );
};
