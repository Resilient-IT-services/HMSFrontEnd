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
          pharmacyService.listPrescriptions({ status: 'PENDING' }),
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
    return {
      totalPrescriptions: (prescriptions || []).length,
      lowStockCount: typeof lowStockCount === 'number' ? lowStockCount : 0,
    };
  }, [lowStockCount, prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
    const term = searchTerm.toLowerCase().trim();

    if (!term) return safePrescriptions;

    return safePrescriptions.filter((p) => {
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
      header: 'Status',
      render: (p) => (
        <Badge variant={p.status === 'PENDING' ? 'orange' : p.status === 'DISPENSED' ? 'emerald' : 'slate'}>
          {p.status || 'PENDING'}
        </Badge>
      ),
      className: 'text-center'
    },
    {
      header: 'Action',
      render: (p) => (
        <Link href={`/pharmacy/sales?prescriptionId=${p.id}`} className="text-orange-600 hover:underline text-sm font-bold">
          Process Bill
        </Link>
      ),
      className: 'text-right'
    }
  ];

  const metricItems = [
    {
      label: 'Total Prescriptions',
      value: stats.totalPrescriptions,
      variant: 'blue' as const,
      icon: 'pending_actions',
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
      title: 'Active prescriptions',
      description: `${stats.totalPrescriptions} records are in the system.`,
      accentClassName: 'border-orange-600'
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


          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
