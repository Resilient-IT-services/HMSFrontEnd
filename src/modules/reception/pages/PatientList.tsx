'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useRouter } from 'next/navigation';
import { Table, Column } from '@/components/ui/Table';
import { PatientSummaryDTO } from '@/types/api';
import { useReceptionPatients } from '@/modules/reception/hooks/useReceptionPatients';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';

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
        <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">
          {row.patientCode || 'N/A'}
        </span>
      )
    },
    {
      header: 'Patient Profile',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase border-2 border-white shadow-sm">
            {row.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-none mb-1">{row.fullName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{row.phone}</p>
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
        <div className="flex justify-center gap-2 items-center">
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
      <div className="p-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f9f9ff] min-h-screen font-inter">
        
        <PageHeading 
          title="Patient Directory" 
          description="Access and manage comprehensive electronic health records."
        >
          <Button icon="person_add" size="xl" href="/reception/patients/create">
            Register New Patient
          </Button>
        </PageHeading>

        {/* Stats & Search Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
           <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricCard label="Total Records" value={totalElements} icon="group" variant="slate" />
              <MetricCard label="New Today" value="04" icon="how_to_reg" variant="emerald" />
              <MetricCard label="In-Patient" value="12" icon="bed" variant="blue" />
           </div>

           <div className="lg:col-span-5 flex items-stretch">
             <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-full flex items-center">
                <SearchInput 
                  placeholder="Search by name, ID, or phone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
           </div>
        </div>

        {/* Directory Table Container */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
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
        </div>
      </div>
    </MainLayout>
  );
}
