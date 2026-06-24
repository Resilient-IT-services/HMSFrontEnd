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
                <div className="flex items-center justify-center text-center">
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
                <div className="flex items-center justify-center gap-2">
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
                    width="680px"
                >
                    <div className="flex flex-col lg:flex-row w-full font-inter text-slate-900 bg-white">

                        {/* Left Info Section - Soft Light Gradient Background */}
                        <div className="w-full lg:w-[42%] bg-gradient-to-br from-orange-50/70 via-slate-50/50 to-orange-100/15 p-6 sm:p-8 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                                        Network Node Overview
                                    </span>
                                </div>
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 font-black text-2xl uppercase text-orange-700 shadow-sm mb-4">
                                    {selectedHospital.name.slice(0, 2)}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                                    {selectedHospital.name}
                                </h3>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-500 mt-3 w-fit shadow-sm">
                                    <span className="material-symbols-outlined text-sm text-orange-600">fingerprint</span>
                                    <span>Facility ID: <span className="font-mono text-slate-800 font-bold">{selectedHospital.code}</span></span>
                                </div>
                            </div>

                            <div className="space-y-4 mt-8 lg:mt-0">
                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Operational Status</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-black uppercase tracking-wider ${selectedHospital.status === 'ACTIVE' ? 'text-emerald-600' : 'text-orange-600'}`}>
                                            {selectedHospital.status === 'ACTIVE' ? 'Operational' : selectedHospital.status}
                                        </span>
                                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedHospital.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                            <span className="material-symbols-outlined text-lg">{selectedHospital.status === 'ACTIVE' ? 'check_circle' : 'warning'}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">System Timezone</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-800">{selectedHospital.timezone || 'Asia/Kolkata'}</span>
                                        <span className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400">
                                            <span className="material-symbols-outlined text-lg">schedule</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Detailed Grid Section - White Clean Background */}
                        <div className="w-full lg:w-[58%] p-6 sm:p-8 bg-white flex flex-col gap-6">
                            {/* Registration & Legal Details */}
                            <div>
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">verified_user</span>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Legal Identifiers
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3.5 bg-slate-50 hover:bg-slate-100/60 transition-colors rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reg. Number</p>
                                        <p className="text-xs font-bold text-slate-800 font-mono">{selectedHospital.registrationNo || 'N/A'}</p>
                                    </div>
                                    <div className="p-3.5 bg-slate-50 hover:bg-slate-100/60 transition-colors rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">GSTIN Identity</p>
                                        <p className="text-xs font-bold text-orange-600 tracking-wider font-mono">
                                            {selectedHospital.gstin || 'Not Provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Department Catalog */}
                            <div>
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">medical_services</span>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Service Departments
                                    </h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedHospital.departments && selectedHospital.departments.length > 0 ? (
                                        selectedHospital.departments.map((dept: string) => (
                                            <span key={dept} className="px-3 py-1.5 bg-orange-50 border border-orange-100/80 text-orange-700 hover:bg-orange-100/50 hover:border-orange-200 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-sm">
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
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">location_on</span>
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Physical Infrastructure
                                    </h4>
                                </div>
                                <div className="bg-orange-50/20 p-5 rounded-2xl border border-orange-100/40">
                                    <div className="mb-4">
                                        <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-1">Full Address</p>
                                        <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                            {selectedHospital.address || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-orange-200/20">
                                        <div>
                                            <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-1">City</p>
                                            <p className="text-xs font-bold text-slate-900">{selectedHospital.city || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-1">State</p>
                                            <p className="text-xs font-bold text-slate-900">{selectedHospital.state || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-1">Pincode</p>
                                            <p className="text-xs font-bold text-slate-900 tracking-wider font-mono">{selectedHospital.pincode || 'N/A'}</p>
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