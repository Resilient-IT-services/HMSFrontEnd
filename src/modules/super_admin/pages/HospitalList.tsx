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
            // Header aur cell dono ki width exact 110px control kari h aur content ko text-center kiya h taaki perpendicular mid-axis perfect line up ho
            headerClassName: 'text-center w-[110px] px-0 mx-0',
            className: 'text-center w-[110px] px-0 mx-0',
            render: (hospital) => (
                // flex wrapper ko flex-row aur justify-center dekar dono buttons ko direct text axis ke mid me structural balance de diya h
                <div className="flex items-center justify-center gap-2 mx-auto w-full">
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
}