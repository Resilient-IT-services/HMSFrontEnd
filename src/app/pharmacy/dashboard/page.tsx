'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import apiClient from '@/services/apiClient';
import { ApiResponse, PrescriptionResponse } from '@/types/api';
import { Pill, FileText, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const PharmacyDashboard = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingBills: 0,
    dispensedToday: 0,
    lowStock: 0,
  });

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        // Assuming there's an endpoint for prescriptions
        const response = await apiClient.get<ApiResponse<{ content: PrescriptionResponse[] }>>('/pharmacy/prescriptions');
        if (response.data.success) {
          const content = response.data.data?.content || [];
          setPrescriptions(content);
          setStats(prev => ({
            ...prev,
            pendingBills: content.filter(p => p.status === 'PENDING').length,
          }));
        }

        // Fetch stock stats
        const stockRes = await apiClient.get<ApiResponse<{ totalElements: number }>>('/pharmacy/stock?lowStock=true');
        if (stockRes.data.success) {
          setStats(prev => ({
            ...prev,
            lowStock: stockRes.data.data?.totalElements || 0,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch pharmacy data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const columns = [
    { header: 'ID', accessor: (row: PrescriptionResponse) => row.id },
    { header: 'Patient', accessor: (row: PrescriptionResponse) => row.patientName },
    { header: 'Doctor', accessor: (row: PrescriptionResponse) => row.doctorName },
    { header: 'Date', accessor: (row: PrescriptionResponse) => new Date(row.createdAt).toLocaleDateString() },
    { 
      header: 'Status', 
      accessor: (row: PrescriptionResponse) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'DISPENSED' ? 'bg-[var(--success-light)] text-[var(--success)]' : 'bg-[var(--warning-light)] text-[var(--warning)]'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: PrescriptionResponse) => (
        <Link 
          href={`/pharmacy/billing/${row.id}`} 
          className="btn-primary text-xs"
        >
          Generate Bill
        </Link>
      )
    }
  ];

  return (
    <MainLayout title="Pharmacy Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-[var(--warning-light)] rounded-full">
            <FileText className="h-6 w-6 text-[var(--warning)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Pending Prescriptions</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.pendingBills}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-[var(--success-light)] rounded-full">
            <ShoppingCart className="h-6 w-6 text-[var(--success)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Dispensed Today</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.dispensedToday}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-[var(--error-light)] rounded-full">
            <Pill className="h-6 w-6 text-[var(--error)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.lowStock}</p>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Prescription Queue</h3>
        <Link href="/pharmacy/stock" className="btn-primary">
          Manage Stock
        </Link>
      </div>

      <Card>
        <Table columns={columns} data={prescriptions} isLoading={loading} />
      </Card>
    </MainLayout>
  );
};

export default PharmacyDashboard;
