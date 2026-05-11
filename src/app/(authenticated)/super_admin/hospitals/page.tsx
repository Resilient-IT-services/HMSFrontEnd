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
import { Pagination } from '@/components/ui/Pagination';

const HospitalManagement = () => {
  const router = useRouter();
  const {
    hospitals,
    loading,
    totalElements,
    page,
    setPage,
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

  const columns: Column<HospitalResponse>[] = [
    {
      header: 'Hospital Name & ID',
      render: (h) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 font-bold overflow-hidden uppercase">
            {h.name.slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{h.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {h.code}</p>
          </div>
        </div>
      )
    },
    {
      header: 'City',
      render: (h) => h.city ?? 'N/A'
    },
    {
      header: 'Status',
      render: (h) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${h.status === 'ACTIVE' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">
            {h.status === 'ACTIVE' ? 'Operational' : h.status}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (h) => (
        <div className="flex justify-center gap-2 items-center">
          <Button 
            variant="secondary" 
            size="sm" 
            icon="edit"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/super_admin/hospitals/${h.id}`);
            }}
            title="Edit Facility"
          />
          <Button 
            variant="secondary" 
            size="sm" 
            icon="visibility"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(h);
            }}
            title="View Details"
          />
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Hospital Network" hideTitle>
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f7f9fb] min-h-screen font-inter">
        
        <PageHeading 
          title="Hospital Network" 
          description="Manage and monitor interconnected healthcare facilities across the region."
        >
          <Button icon="add" size="lg" href="/super_admin/hospitals/create">
            Register New Hospital
          </Button>
        </PageHeading>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-4">
            <div className="flex-1 min-w-[300px]">
              <SearchInput 
                placeholder="Search hospitals by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3 relative">
              <Button 
                variant="secondary" 
                icon="filter_list" 
                onClick={() => setShowFilter(!showFilter)}
              >
                Filter
              </Button>
              {showFilter && (
                  <div className="absolute right-0 top-12 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                      Filter by Status
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ONBOARDING'].map((status) => (
                          <div
                              key={status}
                              onClick={() => {setStatusFilter(status); setShowFilter(false);}}
                              className={`px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center ${statusFilter === status ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
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

          <Table 
            columns={columns} 
            data={hospitals} 
            isLoading={loading}
            onRowDoubleClick={(h) => router.push(`/super_admin/hospitals/${h.id}`)}
            emptyMessage="No hospitals found matching your criteria."
          />

          <Pagination 
            page={page} 
            totalElements={totalElements} 
            onPageChange={setPage} 
            label="facilities"
          />
        </div>

        {/* Info Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-manrope text-xl font-bold text-slate-900">Regional Coverage</h3>
              <Badge variant="orange">Live Map View</Badge>
            </div>
            <div className="relative h-64 w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ad2c00 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-50">Interactive Network Map Engine</p>
              </div>
              <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-orange-700 rounded-full animate-pulse ring-4 ring-orange-700/20"></div>
              <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-orange-700 rounded-full animate-pulse ring-4 ring-orange-700/20"></div>
              <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-orange-700 rounded-full animate-pulse ring-4 ring-orange-700/20"></div>
            </div>
          </div>
          <div className="bg-orange-700 p-8 rounded-xl text-white flex flex-col justify-between overflow-hidden relative shadow-lg shadow-orange-700/20">
            <div className="relative z-10">
              <span className="material-symbols-outlined text-4xl mb-4">verified_user</span>
              <h4 className="text-xl font-bold font-manrope mb-2 uppercase">Compliance Alert</h4>
              <p className="text-white/80 text-sm font-medium leading-relaxed">3 facilities in the South Basin region require mandatory safety audit renewals by the end of this quarter.</p>
            </div>
            <Button variant="secondary" fullWidth className="mt-8 relative z-10">
                View Audit Schedule
            </Button>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>

      {/* Hospital Details Modal */}
      {isModalOpen && selectedHospital && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-orange-100 overflow-hidden animate-fadeIn mx-4">
              <div className="flex justify-between items-center px-6 py-4 bg-orange-700 text-white">
                <h2 className="text-lg font-bold">Hospital Details</h2>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/80 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500 text-sm">Name</span>
                  <span className="font-semibold text-slate-900">{selectedHospital.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500 text-sm">Hospital ID</span>
                  <span className="font-semibold text-slate-900">{selectedHospital.code}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500 text-sm">Status</span>
                  <span className={`font-bold ${
                      selectedHospital.status === 'ACTIVE' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {selectedHospital.status}
                  </span>
                </div>
                <div className="mt-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <h3 className="text-sm font-bold text-orange-700 mb-2 uppercase tracking-wide">
                    Address Information
                  </h3>
                  <p className="text-sm text-slate-700"><b className="text-slate-900">Full Address:</b> {selectedHospital.address}</p>
                  <p className="text-sm text-slate-700"><b className="text-slate-900">City:</b> {selectedHospital.city }</p>
                  <p className="text-sm text-slate-700"><b className="text-slate-900">State:</b> {selectedHospital.state }</p>
                  <p className="text-sm text-slate-700"><b className="text-slate-900">Pincode:</b> {selectedHospital.pincode }</p>
                </div>
              </div>
            </div>
          </div>
      )}
    </MainLayout>
  );
};

export default HospitalManagement;
