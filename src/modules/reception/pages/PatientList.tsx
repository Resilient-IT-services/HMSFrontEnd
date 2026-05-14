'use client';

import React, {useEffect, useState} from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useRouter } from 'next/navigation';
import { Table, Column } from '@/components/ui/Table';
import { PatientSummaryDTO } from '@/types/api';
import { useReceptionPatients } from '@/modules/reception/hooks/useReceptionPatients';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { MetricsGrid } from '@/components/ui/MetricsGrid';
import { PageSurface } from '@/components/ui/PageSurface';

export function PatientList() {
  const router = useRouter();
  const {
    patients,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalElements
  } = useReceptionPatients();

  const columns: Column<PatientSummaryDTO>[] = [
    {
      header: 'Patient Code',
      render: (row) => (
        <span className="rounded bg-orange-50 px-2 py-1 font-mono text-xs font-bold text-orange-700">
          {row.patientCode || 'N/A'}
        </span>
      )
    },
    {
      header: 'Patient Profile',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-slate-100 font-bold uppercase text-slate-400 shadow-sm">
            {row.fullName.split(' ').map((name) => name[0]).join('')}
          </div>
          <div>
            <p className="mb-1 text-sm font-bold leading-none text-slate-900">{row.fullName}</p>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">{row.phone}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Gender',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => <span className="capitalize">{row.gender.toLowerCase()}</span>
    },
    {
      header: 'Category',
      headerClassName: 'text-center',
      className: 'text-center',
      render: () => <Badge variant="blue">Out-Patient</Badge>
    },
    {
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            href={`/reception/appointments/create?patientId=${row.id}`}
            className="border-orange-100"
          >
            Book Visit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon="visibility"
            onClick={() => router.push(`/reception/patients/${row.id}`)}
            title="View Profile"
          />
        </div>
      )
    }
  ];
  const [dashboardStats, setDashboardStats] = useState({
    newToday: 0,
    inPatient: 0
  });

  useEffect(() => {

    const fetchDashboardStats = async () => {

      try {

        const response = await fetch(
            '/api/v1/patients/dashboard-stats'
        );

        const result = await response.json();

        setDashboardStats(result.data);

      } catch (error) {

        console.error(
            'Failed to fetch dashboard stats',
            error
        );
      }
    };

    fetchDashboardStats();

  }, []);

  const metricItems = [
    {
      label: 'Total Records',
      value: totalElements,
      icon: 'group',
      variant: 'slate' as const
    },
    {
      label: 'New Today',
      value: dashboardStats.newToday,
      icon: 'how_to_reg',
      variant: 'emerald' as const
    },
    {
      label: 'In-Patient',
      value: dashboardStats.inPatient,
      icon: 'bed',
      variant: 'blue' as const
    }
  ];
  return (
    <MainLayout title="Patient Directory" hideTitle>
      <PageSurface maxWidthClassName="max-w-[1600px]" fontClassName="font-inter">
        <PageHeading
          title="Patient Directory"
          description="Access and manage comprehensive electronic health records."
        >
          <Button icon="person_add" size="xl" href="/reception/patients/create">
            Register New Patient
          </Button>
        </PageHeading>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <MetricsGrid items={metricItems} className="grid-cols-2 gap-4 lg:col-span-7 sm:grid-cols-3" />
          <div className="flex items-stretch lg:col-span-5">
            <div className="flex w-full items-center rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
              <SearchInput
                placeholder="Search by name, ID, or phone..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </div>

        <ContentPanel className="mb-12 border-slate-100">
          <Table
            columns={columns}
            data={patients}
            isLoading={loading}
            onRowDoubleClick={(row) => router.push(`/reception/patients/${row.id}`)}
            emptyMessage="No patient records found."
          />

          <Pagination
            page={page}
            totalElements={totalElements}
            onPageChange={setPage}
            label="patients"
          />
        </ContentPanel>
      </PageSurface>
    </MainLayout>
  );
}
