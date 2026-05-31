'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { DoctorStaffResponse } from '@/types/api';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, Eye, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useReceptionDoctors } from '@/modules/reception/hooks/useReceptionDoctors';
import { getPrimaryDepartment, getPrimarySpecialization } from '@/utils/staffDisplay';
import { PageSurface } from '@/components/ui/PageSurface';

export function DoctorList() {
  const {
    doctors,
    loading,
    searchTerm,
    setSearchTerm,
    selectedDepartment,
    setSelectedDepartment,
    columnFilters,
    setColumnFilters,
    departmentOptions,
    selectedDoctor,
    setSelectedDoctor,
    selectedDate,
    setSelectedDate,
    availability,
    loadingSchedule,
    dateOptions,
    viewSchedule
  } = useReceptionDoctors();

  // Define Columns for the generic Table
  const columns: Column<DoctorStaffResponse>[] = [
    { 
      header: 'Doctor Name', 
      mobilePosition: 'title',
      filterable: true,
      filterPlaceholder: 'Name...',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-black uppercase">
            {row.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--text-primary)]">{row.fullName}</span>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">{getPrimarySpecialization(row)}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Department', 
      mobilePosition: 'subtitle',
      filterable: true,
      filterType: 'select',
      filterOptions: departmentOptions.map(d => ({ label: d, value: d })),
      render: (row) => (
        <span className="text-sm font-medium text-[var(--text-primary)]">{getPrimaryDepartment(row)}</span>
      )
    },
    { 
      header: 'Contact', 
      mobilePosition: 'body',
      filterable: true,
      filterPlaceholder: 'Phone...',
      key: 'phone' 
    },
    {
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      mobilePosition: 'action',
      render: (row) => (
        <div className="flex justify-center gap-2 items-center">
          <button 
            onClick={() => viewSchedule(row)}
            className="p-2 text-slate-400 hover:text-orange-700 transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm"
            title="View Schedule"
          >
            <Eye className="size-4" />
          </button>
          <Link 
            href={`/reception/appointments/create?doctorId=${row.doctorId}`}
            className="p-2 text-slate-400 hover:text-orange-700 transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm"
            title="Book Appointment"
          >
            <UserPlus className="size-4" />
          </Link>
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Medical Staff" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <Card className="lg:col-span-3">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] size-5" />
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all font-medium" 
                      placeholder="Search by Doctor Name"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative min-w-full lg:min-w-64">
                    <Filter className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <select
                      className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-12 pr-10 font-bold uppercase text-[var(--text-secondary)] outline-none transition-all hover:border-[var(--primary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                      value={selectedDepartment}
                      onChange={(event) => setSelectedDepartment(event.target.value)}
                      aria-label="Filter doctors by department"
                    >
                      <option value="">ALL DEPARTMENTS</option>
                      {departmentOptions.map((department) => (
                        <option key={department} value={department}>
                          {department.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base text-[var(--text-secondary)]">
                      expand_more
                    </span>
                  </div>
                </div>

                <Table 
                  columns={columns} 
                  data={doctors} 
                  isLoading={loading} 
                  onRowDoubleClick={(row) => viewSchedule(row)}
                  loadingMessage="Retrieving medical staff registry..."
                  emptyMessage="No doctors found matching your criteria."
                  onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                  activeFilters={columnFilters}
                />


                {/*<Card className="p-4">*/}
                {/*   <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4 opacity-50 text-center">Duty Overview</h3>*/}
                {/*   <div className="space-y-3">*/}
                {/*      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--success-light)]/30 border border-[var(--success)]/10">*/}
                {/*         <span className="text-[10px] font-bold text-[var(--success)] uppercase">On Duty</span>*/}
                {/*         <span className="text-lg font-black text-[var(--text-primary)]">{doctors.length}</span>*/}
                {/*      </div>*/}
                {/*      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--warning-light)]/30 border border-[var(--warning)]/10">*/}
                {/*         <span className="text-[10px] font-bold text-[var(--warning)] uppercase">In Surgery</span>*/}
                {/*         <span className="text-lg font-black text-[var(--text-primary)]">0</span>*/}
                {/*      </div>*/}
                {/*      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--error-light)]/30 border border-[var(--error)]/10">*/}
                {/*         <span className="text-[10px] font-bold text-[var(--error)] uppercase">Off Duty</span>*/}
                {/*         <span className="text-lg font-black text-[var(--text-primary)]">0</span>*/}
                {/*      </div>*/}
                {/*   </div>*/}
                {/*</Card>*/}

            </Card>;
            </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
}
