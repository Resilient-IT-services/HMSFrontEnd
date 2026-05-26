'use client';

import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyService } from '@/services/pharmacyService';
import { PrescriptionResponse } from '@/types/api';
import Link from 'next/link';
import { Table, Column } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MetricsGrid } from '@/components/ui/MetricsGrid';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';

export const PharmacyDashboard = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [prescriptionResponse, lowStockResponse] = await Promise.allSettled([
          pharmacyService.listPrescriptions(),
          pharmacyService.getLowStockCount(),
        ]);

        if (prescriptionResponse.status === 'fulfilled') {
          const res = prescriptionResponse.value;
          if (res.success && res.data && Array.isArray(res.data.content)) {
            setPrescriptions(res.data.content);
          } else {
            console.error('Pharmacy Dashboard - Prescriptions API returned unsuccessful or invalid data:', res);
            setPrescriptions([]);
          }
        } else {
          console.error('Pharmacy Dashboard - Prescriptions API request failed:', prescriptionResponse.reason);
          setPrescriptions([]);
        }

        if (lowStockResponse.status === 'fulfilled') {
          const res = lowStockResponse.value;
          if (res.success && res.data && typeof res.data.totalElements === 'number') {
            setLowStockCount(res.data.totalElements);
          } else {
            console.error('Pharmacy Dashboard - Low Stock API returned unsuccessful or invalid data:', res);
            setLowStockCount(0);
          }
        } else {
          console.error('Pharmacy Dashboard - Low Stock API request failed:', lowStockResponse.reason);
          setLowStockCount(0);
        }
      } catch (error) {
        console.error('Pharmacy Dashboard - Unexpected Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
    
    // Correct Pending logic: Not Dispensed, Not Completed, Not Cancelled
    const pendingPrescriptions = safePrescriptions.filter((p) => {
      const s = (p.status || '').toUpperCase();
      return !['DISPENSED', 'COMPLETED', 'CANCELLED'].includes(s);
    }).length;
    
    // Correct Completed logic: Either Dispensed or Completed (Case-insensitive)
    const dispensedToday = safePrescriptions.filter((p) => {
      const s = (p.status || '').toUpperCase();
      return s === 'DISPENSED' || s === 'COMPLETED';
    }).length;

    return {
      pendingPrescriptions,
      dispensedToday,
      lowStockCount: typeof lowStockCount === 'number' ? lowStockCount : 0,
    };
  }, [lowStockCount, prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
    const term = searchTerm.toLowerCase().trim();

    return safePrescriptions.filter((p) => {
      // 1. Hide finalized prescriptions from the dashboard queue
      const s = (p.status || '').toUpperCase();
      if (['DISPENSED', 'COMPLETED', 'CANCELLED'].includes(s)) return false;

      // 2. Multi-field search
      if (!term) return true;
      return (
        p.patientName?.toLowerCase().includes(term) ||
        p.id?.toString().toLowerCase().includes(term) ||
        p.patientId?.toString().toLowerCase().includes(term) ||
        p.patientCode?.toLowerCase().includes(term)
      );
    });
  }, [prescriptions, searchTerm]);

  const prescriptionColumns: Column<PrescriptionResponse>[] = [
    {
      header: 'Patient',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900">{p.patientName}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
            ID: {p.patientCode || p.patientId || 'N/A'}
          </p>
        </div>
      )
    },
    {
      header: 'Rx Ref',
      render: (p) => (
        <span className="font-mono text-[11px] font-black bg-slate-100 px-2 py-1 rounded text-slate-600">
          #{p.id?.toString().slice(-6).toUpperCase() || 'N/A'}
        </span>
      )
    },
    {
      header: 'Doctor',
      key: 'doctorName',
      className: 'text-sm font-medium text-slate-700'
    },
    {
      header: 'Items',
      render: (p) => <Badge variant="blue">{p.items?.length || 0} items</Badge>,
      className: 'text-center'
    },
    {
      header: 'Action',
      render: (p) => (
        <Link href={`/pharmacy/prescriptions/${p.id}`} className="text-orange-600 hover:underline text-sm font-bold">
          Process Bill
        </Link>
      ),
      className: 'text-right'
    }
  ];

  const metricItems = [
    {
      label: 'Pending Prescriptions',
      value: stats.pendingPrescriptions,
      variant: 'blue' as const,
      icon: 'pending_actions',
      layout: 'horizontal' as const,
      tag: 'Live'
    },
    {
      label: 'Completed Prescriptions',
      value: stats.dispensedToday,
      variant: 'emerald' as const,
      icon: 'task_alt',
      layout: 'horizontal' as const,
      tag: 'Live'
    },
    {
      label: 'Low Stock Alerts',
      value: stats.lowStockCount,
      variant: 'orange' as const,
      icon: 'warning',
      layout: 'horizontal' as const,
      tag: 'Live'
    },

  ];

  const operationalSummary = [
    {
      title: 'Pending prescriptions',
      description: `${stats.pendingPrescriptions} records are waiting to be dispensed.`,
      accentClassName: 'border-orange-600'
    },
    {
      title: 'Completed prescriptions',
      description: `${stats.dispensedToday} records are already marked as completed.`,
      accentClassName: 'border-slate-200'
    }
  ];

  return (
    <MainLayout title="Pharmacy Overview" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PageHeading 
            title="Pharmacy Overview" 
            description="Monitor real-time prescriptions, inventory alerts, and daily fulfillment metrics."
          />

          <MetricsGrid items={metricItems} className="mb-10" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Card 
                title="Prescription Queue" 
                className="p-0 overflow-hidden"
                headerActions={
                  <Button variant="ghost" size="sm" className="font-semibold text-orange-600">Advanced Search</Button>
                }
              >
                <div className="p-6 pb-0">
                  <SearchInput 
                    placeholder="Search by Patient Name, ID, or Rx ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Table 
                  columns={prescriptionColumns} 
                  data={filteredPrescriptions} 
                  isLoading={loading}
                  emptyMessage="No prescriptions found."
                />
              </Card>
            </div>

            <div className="space-y-8">
              <Card title="Queue Snapshot" subtitle="VOLUME TREND">
                <div className="h-48 w-full flex items-end gap-3 px-2">
                  {[
                    { label: 'Pending', value: stats.pendingPrescriptions, color: 'bg-blue-600' },
                    { label: 'Done', value: stats.dispensedToday, color: 'bg-emerald-600' },
                    { label: 'Alerts', value: stats.lowStockCount, color: 'bg-orange-600' }
                  ].map((item, index) => {
                    const total = Math.max(stats.pendingPrescriptions + stats.dispensedToday + stats.lowStockCount, 1);
                    const height = (item.value / total) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
                        <div className="flex-1 w-full flex flex-col justify-end">
                          <div
                            className={`w-full rounded-t-lg transition-all ${item.color} opacity-80 hover:opacity-100 shadow-lg`}
                            style={{ height: `${Math.max(8, height)}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter leading-none">{item.label}</p>
                          <p className="text-sm font-black text-slate-800 leading-tight">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card title="Inventory Status" subtitle="STOCK ALERTS">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Low stock medicines</p>
                      <p className="text-xs text-slate-500 font-medium">{stats.lowStockCount} inventory records currently need attention.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{stats.lowStockCount}</span>
                  </div>
                  <Button variant="secondary" fullWidth href="/pharmacy/stock">Review Stock Queue</Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
