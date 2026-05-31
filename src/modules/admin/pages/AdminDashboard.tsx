'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { Table, Column } from '@/components/ui/Table';
import { adminService } from '@/services/adminService';
import { HospitalResponse } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useHospitals } from '@/modules/super_admin/hooks/useHospitals';
import { Pagination } from '@/components/ui/Pagination';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Modal } from '@/components/ui/Modal';

export const AdminDashboard = () => {
  const router = useRouter();
  const {
    hospitals,
    loading,
    totalElements,
    page,
    setPage,
    pageSize,
    setPageSize,
    statusFilter,
    setStatusFilter,
    columnFilters,
    setColumnFilters,
    selectedHospital,
    isModalOpen,
    setIsModalOpen,
    handleViewDetails
    } = useHospitals();

  const [adminStats, setAdminStats] = useState({
    totalHospitals: 0,
    platformUsers: 0,
    activeNow: 0,
    certifiedDoctors: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await adminService.getAdminStats();
        if (statsRes.success && statsRes.data) {
          setAdminStats({
            totalHospitals: statsRes.data.totalHospitals,
            platformUsers: statsRes.data.totalUsers,
            activeNow: statsRes.data.activeUsers,
            certifiedDoctors: statsRes.data.totalDoctors
          });
        }
      } catch (error) {
        console.error('Admin Dashboard Stats Fetch Error:', error);
      }
    };
    fetchData();
  }, []);


  const columns: Column<HospitalResponse>[] = [
    {
      header: 'Hospital Name & ID',
      filterable: true,
      filterPlaceholder: 'Name or ID...',
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
      filterable: true,
      filterPlaceholder: 'City...',
      render: (hospital) => hospital.city ?? 'N/A'
    },
    {
      header: 'Status',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Operational', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
        { label: 'Suspended', value: 'SUSPENDED' },
        { label: 'Onboarding', value: 'ONBOARDING' }
      ],
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
      <MainLayout title="Admin Overview">
        <PageSurface
            maxWidthClassName="max-w-[1600px]"
            backgroundClassName="bg-[#f8f9fb]"
            fontClassName="font-inter"
        >
          <div className="space-y-8 py-4 md:py-8">
            <PageHeading
                title="Admin Overview"
                description="Real-time health indicators and administrative network status."
                className="hidden md:flex"
            >
              <Button variant="secondary" icon="person_add"  onClick={() => router.push('/admin/users/create')}>Hire User</Button>
              <Button
                  onClick={() => router.push('/super_admin/hospitals/create')}
                  icon="add"
              >
                Onboard Hospital
              </Button>
            </PageHeading>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard label="Total Hospitals" value={adminStats.totalHospitals} icon="apartment" variant="orange" trend="+12%" layout="horizontal" />
                <MetricCard label="Platform Users" value={adminStats.platformUsers} icon="group" variant="blue" trend="+5.4%" layout="horizontal" />
                <MetricCard label="Active Now" value={adminStats.activeNow} icon="bolt" variant="emerald" pulse layout="horizontal" />
                <MetricCard label="Certified Doctors" value={adminStats.certifiedDoctors} icon="medical_services" variant="purple" trend="Stable" layout="horizontal" />
              </div>

              <ContentPanel className="rounded-xl">
                <Table
                    columns={columns}
                    data={hospitals}
                    isLoading={loading}
                    onRowDoubleClick={(hospital) => router.push(`/super_admin/hospitals/${hospital.id}`)}
                    emptyMessage="No hospitals found matching your criteria."
                    onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                    activeFilters={columnFilters}
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
          </div>
        </PageSurface>

        {/*HOSPITAL DETAILS MODAL */}
        {isModalOpen && selectedHospital && (
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Facility Master Profile"
                size="xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 font-inter text-slate-900 bg-white">

                {/* Left Info Section - Clean Light Background */}
                <div className="lg:col-span-5 bg-slate-50 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                    Network Node Overview
                  </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
                      {selectedHospital.name}
                    </h3>
                    <p className="text-sm font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-base">fingerprint</span>
                      Facility ID: {selectedHospital.code}
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Status</p>
                      <div className="flex items-center justify-between">
                    <span className={`text-sm font-black uppercase ${selectedHospital.status === 'ACTIVE' ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {selectedHospital.status === 'ACTIVE' ? 'Operational' : selectedHospital.status}
                    </span>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ${selectedHospital.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                      <span className="material-symbols-outlined text-xl">{selectedHospital.status === 'ACTIVE' ? 'check_circle' : 'warning'}</span>
                    </span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">System Timezone</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{selectedHospital.timezone || 'Asia/Kolkata'}</span>
                        <span className="material-symbols-outlined text-slate-400">schedule</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Detailed Grid Section - White Clean Background */}
                <div className="lg:col-span-7 p-6 sm:p-8 bg-white max-h-[80vh] overflow-y-auto custom-scrollbar">

                  {/* Registration & Legal Details */}
                  <div className="mb-8">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="h-1 w-4 bg-orange-600 rounded-full" />
                      Legal Identifiers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reg. Number</p>
                        <p className="text-sm font-black text-slate-900">{selectedHospital.registrationNo || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GSTIN Identity</p>
                        <p className="text-sm font-black text-orange-600 tracking-wider">
                          {selectedHospital.gstin || 'Not Provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Department Catalog */}
                  <div className="mb-8">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="h-1 w-4 bg-orange-600 rounded-full" />
                      Service Departments
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedHospital.departments && selectedHospital.departments.length > 0 ? (
                          selectedHospital.departments.map((dept: string) => (
                              <span key={dept} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-tight shadow-sm hover:border-orange-200 transition-all">
                        {dept}
                      </span>
                          ))
                      ) : (
                          <p className="text-xs text-slate-400 italic">No departments configured.</p>
                      )}
                    </div>
                  </div>

                  {/* Address Matrix */}
                  <div>
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="h-1 w-4 bg-orange-600 rounded-full" />
                      Physical Infrastructure
                    </h4>
                    <div className="bg-orange-50/50 p-5 rounded-[2rem] border border-orange-100/50">
                      <div className="mb-4">
                        <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Full Address</p>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                          {selectedHospital.address || 'N/A'}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-orange-200/30">
                        <div>
                          <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">City</p>
                          <p className="text-sm font-black text-slate-900">{selectedHospital.city || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">State</p>
                          <p className="text-sm font-black text-slate-900">{selectedHospital.state || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Pincode</p>
                          <p className="text-sm font-black text-slate-900 tracking-widest">{selectedHospital.pincode || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </Modal>
        )}
      </MainLayout>
  );
};