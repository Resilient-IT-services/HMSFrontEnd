'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { Table, Column } from '@/components/ui/Table';
import { HospitalResponse } from '@/types/api';
import { useHospitals } from '@/modules/super_admin/hooks/useHospitals';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Modal } from '@/components/ui/Modal';
import { PageSurface } from '@/components/ui/PageSurface';

export function HospitalList() {
  const router = useRouter();
  const {
    hospitals,
    loading,
    totalElements,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedHospital,
    isModalOpen,
    setIsModalOpen,
    handleViewDetails
  } = useHospitals();

  const [showFilter, setShowFilter] = useState(false);
  const showExportButton = false;
  const statusOptions = ['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ONBOARDING'];

  const columns: Column<HospitalResponse>[] = [
    {
      header: 'Hospital Name & ID',
      render: (hospital) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-orange-100 font-bold uppercase text-orange-700">
            {hospital.name.slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{hospital.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">ID: {hospital.code}</p>
          </div>
        </div>
      )
    },
    {
      header: 'City',
      render: (hospital) => hospital.city ?? 'N/A'
    },
    {
      header: 'Status',
      render: (hospital) => (
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${hospital.status === 'ACTIVE' ? 'bg-green-500' : 'bg-orange-500'}`} />
          <span className="text-xs font-bold uppercase tracking-tighter text-slate-700">
            {hospital.status === 'ACTIVE' ? 'Operational' : hospital.status}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (hospital) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="edit"
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/super_admin/hospitals/${hospital.id}`);
            }}
            title="Edit Facility"
          />
          <Button
            variant="secondary"
            size="sm"
            icon="visibility"
            onClick={(event) => {
              event.stopPropagation();
              handleViewDetails(hospital);
            }}
            title="View Details"
          />
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Hospital Network">
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PageHeading
            title="Hospital Network"
            description="Manage and monitor interconnected healthcare facilities across the region."
          >
            <Button icon="add" size="lg" href="/super_admin/hospitals/create">
              Register New Hospital
            </Button>
          </PageHeading>

          <ContentPanel
            className="rounded-xl"
            toolbar={(
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-[300px] flex-1">
                  <SearchInput
                    placeholder="Search hospitals by name or code..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div className="relative flex gap-3">
                  <Button variant="secondary" icon="filter_list" onClick={() => setShowFilter(!showFilter)}>
                    Filter
                  </Button>
                  {showFilter && (
                    <div className="absolute right-0 top-12 z-50 w-44 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <div className="border-b px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Filter by Status
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {statusOptions.map((status) => (
                          <div
                            key={status}
                            onClick={() => {
                              setStatusFilter(status);
                              setShowFilter(false);
                            }}
                            className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm ${statusFilter === status ? 'bg-orange-50 font-semibold text-orange-700' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            {status}
                            {statusFilter === status && (
                              <span className="material-symbols-outlined text-sm">check</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {showExportButton && <Button variant="secondary" icon="download">Export</Button>}
                </div>
              </div>
            )}
          >
            <Table
              columns={columns}
              data={hospitals}
              isLoading={loading}
              onRowDoubleClick={(hospital) => router.push(`/super_admin/hospitals/${hospital.id}`)}
              emptyMessage="No hospitals found matching your criteria."
            />

            <Pagination
              page={page}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              label="facilities"
            />
          </ContentPanel>
        </div>
      </PageSurface>

      {isModalOpen && selectedHospital && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Hospital Details" 
          size="lg"
        >
          <div className="space-y-5 p-6">
            {[
              { label: 'Name', value: selectedHospital.name },
              { label: 'Hospital ID', value: selectedHospital.code },
              {
                label: 'Status',
                value: (
                  <span className={`font-bold ${selectedHospital.status === 'ACTIVE' ? 'text-green-600' : 'text-orange-600'}`}>
                    {selectedHospital.status}
                  </span>
                )
              }
            ].map((item) => (
              <div key={item.label} className="flex justify-between border-b pb-2">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
            <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-orange-700">
                Address Information
              </h3>
              <p className="text-sm text-slate-700"><b className="text-slate-900">Full Address:</b> {selectedHospital.address}</p>
              <p className="text-sm text-slate-700"><b className="text-slate-900">City:</b> {selectedHospital.city}</p>
              <p className="text-sm text-slate-700"><b className="text-slate-900">State:</b> {selectedHospital.state}</p>
              <p className="text-sm text-slate-700"><b className="text-slate-900">Pincode:</b> {selectedHospital.pincode}</p>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}
