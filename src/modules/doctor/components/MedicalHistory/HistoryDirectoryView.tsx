'use client';

import React from 'react';
import { Table, Column } from '@/components/ui/Table';
import { AppointmentSummaryDTO, PatientSummaryDTO } from '@/types/api';
import { formatToken } from '@/utils/tokenHelper';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { PageSurface } from '@/components/ui/PageSurface';
import { Card } from '@/components/ui/Card';

interface HistoryDirectoryViewProps {
  activeView: 'APPOINTMENTS' | 'PATIENTS';
  setActiveView: (view: 'APPOINTMENTS' | 'PATIENTS') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  loading: boolean;
  historyAppointments: AppointmentSummaryDTO[];
  patients: PatientSummaryDTO[];
  selectPatient: (id: string) => void;
  appointmentsPage: number;
  patientsPage: number;
  appointmentsTotalElements: number;
  patientsTotalElements: number;
  setAppointmentsPage: (page: number) => void;
  setPatientsPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
}

export const HistoryDirectoryView: React.FC<HistoryDirectoryViewProps> = ({
  activeView,
  setActiveView,
  searchTerm,
  setSearchTerm,
  handleSearch,
  loading,
  historyAppointments,
  patients,
  selectPatient,
  appointmentsPage,
  patientsPage,
  appointmentsTotalElements,
  patientsTotalElements,
  setAppointmentsPage,
  setPatientsPage,
  pageSize,
  setPageSize,
}) => {
  const appointmentColumns: Column<AppointmentSummaryDTO>[] = [
    {
      header: 'Visit Date',
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
      header: 'Patient Profile',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
            {row.patientName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-none mb-1">{row.patientName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Code: {row.patientCode || 'N/A'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Token',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">
          {formatToken(row)}
        </span>
      )
    },
    {
      header: 'Status',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (row) => <Badge variant="emerald">{row.status}</Badge>
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          icon="visibility" 
          onClick={() => selectPatient(row.patientId)}
        >
          View Record
        </Button>
      )
    }
  ];

  const patientColumns: Column<PatientSummaryDTO>[] = [
    {
      header: 'Code',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded uppercase">
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
      className: 'text-center',
      headerClassName: 'text-center',
      render: (row) => <span className="capitalize text-sm font-medium">{row.gender.toLowerCase()}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          icon="history" 
          onClick={() => selectPatient(row.id)}
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
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
              <Button 
                variant={activeView === 'APPOINTMENTS' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('APPOINTMENTS')}
                className={`px-6 py-2 text-xs font-bold ${activeView === 'APPOINTMENTS' ? 'shadow-md' : 'text-slate-500'}`}
              >
                All Visits
              </Button>
              <Button 
                variant={activeView === 'PATIENTS' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('PATIENTS')}
                className={`px-6 py-2 text-xs font-bold ${activeView === 'PATIENTS' ? 'shadow-md' : 'text-slate-500'}`}
              >
                Patients
              </Button>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1">
                <SearchInput 
                  placeholder={activeView === 'APPOINTMENTS' ? "Search by patient name, ID..." : "Search patients by name, code, or phone..."}
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
        {activeView === 'APPOINTMENTS' ? (
          <Table 
            columns={appointmentColumns} 
            data={historyAppointments} 
            isLoading={loading}
            onRowDoubleClick={(row) => selectPatient((row as AppointmentSummaryDTO).patientId)}
            emptyMessage={
              <div className="py-12 text-center">
                <p className="text-slate-400 italic mb-4">No completed visits found matching "{searchTerm}".</p>
                {searchTerm && (
                  <Button variant="secondary" size="sm" onClick={() => setActiveView('PATIENTS')}>
                    Search in All Patients
                  </Button>
                )}
              </div>
            }
          />
        ) : (
          <Table 
            columns={patientColumns} 
            data={patients} 
            isLoading={loading}
            onRowDoubleClick={(row) => selectPatient((row as PatientSummaryDTO).id)}
            emptyMessage={
              <div className="py-12 text-center">
                <p className="text-slate-400 italic">No patient records found matching "{searchTerm}".</p>
              </div>
            }
          />
        )}

        <Pagination 
          page={activeView === 'APPOINTMENTS' ? appointmentsPage : patientsPage} 
          totalElements={activeView === 'APPOINTMENTS' ? appointmentsTotalElements : patientsTotalElements} 
          pageSize={pageSize}
          onPageChange={activeView === 'APPOINTMENTS' ? setAppointmentsPage : setPatientsPage} 
          onPageSizeChange={setPageSize}
          label={activeView === 'APPOINTMENTS' ? "visits" : "patients"}
        />
      </Card>
    </PageSurface>
  );
};
