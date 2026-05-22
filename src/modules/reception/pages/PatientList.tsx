'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useRouter } from 'next/navigation';
import { Table, Column } from '@/components/ui/Table';
import { PatientSummaryDTO } from '@/types/api';
import { useReceptionPatients } from '@/modules/reception/hooks/useReceptionPatients';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { ContentPanel } from '@/components/ui/ContentPanel';
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
    pageSize,
    setPageSize,
    totalElements
  } = useReceptionPatients();

  const columns: Column<PatientSummaryDTO>[] = [
    {
      header: 'Patient Code',
      mobilePosition: 'meta',
      render: (row) => (
        <span className="rounded bg-orange-50 px-2 py-1 font-mono text-xs font-bold text-orange-700">
          {row.patientCode || 'N/A'}
        </span>
      )
    },
    {
      header: 'Patient Profile',
      mobilePosition: 'title',
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
      mobilePosition: 'subtitle',
      render: (row) => <span className="capitalize">{row.gender.toLowerCase()}</span>
    },
    {
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      mobilePosition: 'action',
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

  return (
    <MainLayout title="Patient Directory" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PageHeading
            title="Patient Directory"
            description="Access and manage comprehensive electronic health records."
          >
            <Button icon="person_add" size="xl" href="/reception/patients/create">
              Register New Patient
            </Button>
          </PageHeading>

          <div className="mb-8">
            <div className="flex w-full items-center rounded-2xl border border-slate-100 bg-white p-2 shadow-sm max-w-md">
              <SearchInput
                placeholder="Search by name, ID, or phone..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
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
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              label="patients"
            />
          </ContentPanel>
        </div>
      </PageSurface>
    </MainLayout>
  );
}
