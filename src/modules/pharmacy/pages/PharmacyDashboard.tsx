'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '../api/pharmacyApi';
import { PrescriptionResponse, PharmacyStockDTO, PharmacySaleResponse, QuickPharmacySaleResponse } from '@/types/api';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { Table, Column } from '@/components/ui/Table';
import { SearchInput } from '@/components/ui/SearchInput';
import { PageSurface } from '@/components/ui/PageSurface';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { 
  FileText, Hourglass, CheckCircle2, AlertTriangle, Calendar, 
  IndianRupee, Plus, Search, PlusCircle, Download, 
  ArrowUp, ArrowRight, Eye, Activity
} from 'lucide-react';

import dayjs from 'dayjs';
import { reportService } from '@/services/reportService';

export const PharmacyDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [recentSalesData, setRecentSalesData] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<PharmacyStockDTO[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<PharmacyStockDTO[]>([]);
  
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
    todayRevenue: 0
  });

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const today = dayjs().startOf('day');
      const thirtyDaysFromNow = dayjs().add(30, 'day').endOf('day');

      const [pendingRes, dispensedRes, cancelledRes, stockRes] = await Promise.allSettled([
        pharmacyApi.getPrescriptions({ status: 'PENDING', size: 100 }),
        pharmacyApi.getPrescriptions({ status: 'DISPENSED', size: 100 }),
        pharmacyApi.getPrescriptions({ status: 'CANCELLED', size: 100 }),
        pharmacyApi.getMedicineStock({ size: 1000 })
      ]);

      let pendingList: PrescriptionResponse[] = [];
      let pendingCount = 0;
      let completedCount = 0;
      let cancelledCount = 0;
      let revenue = 0;
      let allStock: PharmacyStockDTO[] = [];
      let dispensedList: PrescriptionResponse[] = [];
      let recentSales: any[] = [];

      // 1. PROCESS PRESCRIPTIONS & REVENUE
      if (pendingRes.status === 'fulfilled' && pendingRes.value.success) {
        pendingList = (pendingRes.value.data?.content as unknown as PrescriptionResponse[]) || [];
        pendingCount = pendingRes.value.data?.totalElements || pendingList.length;
      }
      
      if (dispensedRes.status === 'fulfilled' && dispensedRes.value.success) {
        dispensedList = (dispensedRes.value.data?.content as unknown as PrescriptionResponse[]) || [];
        completedCount = dispensedRes.value.data?.totalElements || dispensedList.length;
        
        // Use completed prescriptions to fetch their sales details
        const todayDispensed = dispensedList.filter(p => dayjs(p.createdAt || Date.now()).isSame(today, 'day'));
        
        // Fetch the sales data for these prescriptions to get exact revenue and invoice details
        const salesPromises = todayDispensed.slice(0, 15).map(p => 
          pharmacyApi.getSaleByPrescription(p.id!).catch(() => null)
        );
        
        const salesResults = await Promise.all(salesPromises);
        
        const validSales = salesResults
          .filter((res): res is { success: true; data: QuickPharmacySaleResponse } => 
            !!(res?.success && res.data)
          )
          .map(res => res.data);

        revenue = validSales.reduce((acc, sale) => acc + (Number(sale.totalAmount || 0)), 0);
        
        recentSales = validSales.toSorted((a, b) => {
          const dateA = dayjs(a.createdAt);
          const dateB = dayjs(b.createdAt);
          return dateB.diff(dateA);
        });
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
      setExpiryAlerts(expiringSoonList.slice(0, 3));
      setMetrics({
        totalPrescriptionsToday: pendingCount + completedCount + cancelledCount,
        pendingPrescriptions: pendingCount,
        completedPrescriptions: completedCount,
        cancelledPrescriptions: cancelledCount,
        lowStockCount: lowStockList.length,
        expiringCount: expiringSoonList.length,
        todayRevenue: revenue
      });

    } catch (error) {
      console.error('Pharmacy Dashboard - Unexpected Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.currentHospitalId]);

  useEffect(() => {
    void fetchDashboardData();
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
            void fetchDashboardData();
          } else {
            triggerGlobalToast(res.message || 'Import failed', 'error');
          }
        } catch (error) {
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
      filterable: true,
      filterPlaceholder: 'Patient name...',
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-800">{p.patientName}</p>
          <p className="text-[10px] text-slate-400 font-normal">PID: {p.patientCode || p.patientId || 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'Doctor',
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

          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Total Prescriptions<br/>Today</p>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{metrics.totalPrescriptionsToday}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Pending Prescriptions<br/>Today</p>
                <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Hourglass className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{metrics.pendingPrescriptions}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Completed<br/>Today</p>
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{metrics.completedPrescriptions}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Low Stock<br/>Medicines</p>
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{metrics.lowStockCount < 10 ? `0${metrics.lowStockCount}` : metrics.lowStockCount}</h3>
                <Link href="/pharmacy/stock?status=LOW_STOCK" className="text-[11px] text-orange-600 font-bold flex items-center gap-0.5 mt-1 hover:underline">
                  View details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Expiring<br/>This Month</p>
                <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="w-4 h-4" /></span>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800">{metrics.expiringCount}</h3>
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
                <h3 className="text-2xl font-bold text-slate-800">₹{metrics.todayRevenue.toLocaleString('en-IN')}</h3>
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

              {/* TODAY'S PERFORMANCE */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Today&apos;s Performance</h3>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 w-20">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span className="text-slate-400">Pending</span>
                      </div>
                      <span className="text-slate-800 font-bold">{metrics.pendingPrescriptions}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 w-20">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-400">Completed</span>
                      </div>
                      <span className="text-slate-800 font-bold">{metrics.completedPrescriptions}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 w-20">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span className="text-slate-400">Cancelled</span>
                      </div>
                      <span className="text-slate-800 font-bold">{metrics.cancelledPrescriptions}</span>
                    </div>
                  </div>
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path 
                        className="text-blue-600" 
                        strokeDasharray={`${Math.round((metrics.completedPrescriptions / (metrics.totalPrescriptionsToday || 1)) * 100)}, 100`} 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="none" 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-base font-bold text-slate-800 leading-none">{Math.round((metrics.completedPrescriptions / (metrics.totalPrescriptionsToday || 1)) * 100)}%</p>
                      <p className="text-[8px] text-slate-400 font-bold tracking-tight uppercase mt-0.5">Rate</p>
                    </div>
                  </div>
                </div>
              </div>

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
