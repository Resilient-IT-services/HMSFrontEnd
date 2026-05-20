'use client';

import React from 'react';
import { Table, Column } from '@/components/ui/Table';
import { AppointmentSummaryDTO, PatientResponse } from '@/types/api';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { PageSurface } from '@/components/ui/PageSurface';
import { Card } from '@/components/ui/Card';

interface HistoryDirectoryViewProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  loading: boolean;
  historyAppointments: AppointmentSummaryDTO[];
  patientDetails: Record<string, PatientResponse>;
  selectPatient: (id: string) => void;
  appointmentsPage: number;
  appointmentsTotalElements: number;
  setAppointmentsPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
}

export const HistoryDirectoryView: React.FC<HistoryDirectoryViewProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  loading,
  historyAppointments,
  patientDetails,
  selectPatient,
  appointmentsPage,
  appointmentsTotalElements,
  setAppointmentsPage,
  pageSize,
  setPageSize,
}) => {
  const columns: Column<AppointmentSummaryDTO>[] = [
    {
      header: 'Patient Code',
      mobilePosition: 'meta',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">
          {row.patientCode || 'N/A'}
        </span>
      )
    },
    {
      header: 'Patient Name',
      mobilePosition: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
            {row.patientName.split(' ').map(n => n[0]).join('')}
          </div>
          <p className="font-bold text-slate-900 text-sm">{row.patientName}</p>
        </div>
      )
    },
    {
      header: 'Gender',
      mobilePosition: 'subtitle',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (row) => {
        const gender = row.patientGender || patientDetails[row.patientId]?.gender;
        return (
          <span className="capitalize text-sm font-medium">{gender?.toLowerCase() || '...'}</span>
        );
      }
    },
    {
      header: 'Visit Date',
      mobilePosition: 'subtitle',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">
            {new Date(row.appointmentTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            {new Date(row.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )
    },
    {
      header: 'Doctor Name',
      mobilePosition: 'meta',
      render: (row) => (
        <p className="text-sm font-medium text-slate-600">Dr. {row.doctorName}</p>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      mobilePosition: 'action',
      render: (row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          icon="history" 
          onClick={() => selectPatient(row.patientId)}
        >
          View History
        </Button>
      )
    }
  ];

  return (
    <PageSurface paddingClassName="p-8">
      <PageHeading 
        title="Medical History" 
        description="Review past consultations and comprehensive patient health records."
      />

      {/* Directory Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-12">
          <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1">
                <SearchInput 
                  placeholder="Search by patient name, code, or doctor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button icon="search" onClick={() => handleSearch()} isLoading={loading}>Search</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <Card className="overflow-hidden mb-12" noPadding>
        <Table 
          columns={columns} 
          data={historyAppointments} 
          isLoading={loading}
          onRowDoubleClick={(row) => selectPatient((row as AppointmentSummaryDTO).patientId)}
          emptyMessage={
            <div className="py-12 text-center">
              <p className="text-slate-400 italic mb-4">No completed visits found matching "{searchTerm}".</p>
            </div>
          }
        />

        <Pagination 
          page={appointmentsPage} 
          totalElements={appointmentsTotalElements} 
          pageSize={pageSize}
          onPageChange={setAppointmentsPage} 
          onPageSizeChange={setPageSize}
          label="visits"
        />
      </Card>
    </PageSurface>
  );
};
