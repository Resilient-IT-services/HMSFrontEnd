'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ipdService } from '@/services/ipdService';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDateTime } from '@/utils/formatters';
import { AdmissionResponseDTO, AdmissionStatus } from '@/types/ipd';
import { ADMISSION_STATUS_OPTIONS } from '@/utils/enumOptions';
import MainLayout from '@/components/ui/MainLayout';

export const DoctorPatients = () => {
  const router = useRouter();
  const [patients, setPatients] = useState<AdmissionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await ipdService.getMyPatients();
        if (res.success && res.data) {
          setPatients(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch doctor patients', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const getStatusVariant = (status: AdmissionStatus) => {
    switch (status) {
      case 'ADMITTED': { return 'orange'; }
      case 'DISCHARGED': { return 'emerald'; }
      case 'CANCELLED': { return 'red'; }
      default: { return 'slate'; }
    }
  };

  const columns: Column<AdmissionResponseDTO>[] = [
    {
      header: 'Admission #',
      key: 'admissionNumber',
      render: (row) => <span className="font-bold text-slate-900">{row.admissionNumber}</span>
    },
    {
      header: 'Patient Name',
      key: 'patientName',
      render: (row) => <span className="font-bold text-slate-900">{row.patientName}</span>
    },
    {
      header: 'Ward',
      key: 'wardName',
      render: (row) => <Badge variant="blue" className="rounded-md">{row.wardName}</Badge>
    },
    {
      header: 'Bed',
      key: 'bedNumber',
      render: (row) => <span className="font-bold text-slate-700">Bed: {row.bedNumber}</span>
    },
    {
      header: 'Admission Date',
      key: 'admissionDateTime',
      render: (row) => <span className="text-slate-500">{formatDateTime(row.admissionDateTime)}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)}>
          {ADMISSION_STATUS_OPTIONS.find(opt => opt.value === row.status)?.label || row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            icon="visibility"
            onClick={() => router.push(`/ipd/admissions/${row.id}`)}
          >
            View Details
          </Button>
        </div>
      )
    }
  ];

  return (
    <MainLayout title="My Admitted Patients">
      <PageSurface>
        <PageHeader title="My Admitted Patients" />
        
        <div className="mt-6 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <Table 
            data={patients} 
            columns={columns} 
            isLoading={loading}
            onRowDoubleClick={(row) => router.push(`/ipd/admissions/${row.id}`)}
          />
        </div>
      </PageSurface>
    </MainLayout>
  );
};
