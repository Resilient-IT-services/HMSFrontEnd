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
    // Ensure prescriptions is an array before processing
    const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
    
    const pendingPrescriptions = safePrescriptions.filter((prescription) => 
      prescription && prescription.status !== 'PENDING'
    ).length;
    
    const dispensedToday = safePrescriptions.filter((prescription) => 
      prescription && prescription.status === 'DISPENSED'
    ).length;
    


    return {
      pendingPrescriptions,
      dispensedToday,

      lowStockCount: typeof lowStockCount === 'number' ? lowStockCount : 0,
    };
  }, [lowStockCount, prescriptions]);

  const prescriptionColumns: Column<PrescriptionResponse>[] = [
    {
      header: 'Patient',
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900">{p.patientName}</p>
          <p className="text-xs text-slate-500">ID: #RX-{p.id}</p>
        </div>
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
                  <SearchInput placeholder="Search by patient name or Rx ID..." />
                </div>
                <Table 
                  columns={prescriptionColumns} 
                  data={prescriptions} 
                  isLoading={loading}
                  emptyMessage="No prescriptions found."
                />
              </Card>

              <Card title="Operational Summary" subtitle="DAILY MONITORING">
                <div className="space-y-6">
                  {operationalSummary.map((item) => (
                    <div key={item.title} className={`flex items-center gap-4 border-l-2 pl-4 ${item.accentClassName}`}>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-8">
              <Card title="Queue Snapshot" subtitle="VOLUME TREND">
                <div className="h-48 w-full flex items-end gap-2 px-2">
                  {[stats.pendingPrescriptions, stats.dispensedToday, stats.lowStockCount].map((value, index) => (
                    <div
                      key={`${value}-${index}`}
                      className="flex-1 rounded-t-lg bg-orange-600/20 hover:bg-orange-600 transition-all"
                      style={{ height: `${Math.max(20, Math.min(100, value * 10 || 20))}%` }}
                    />
                  ))}
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
