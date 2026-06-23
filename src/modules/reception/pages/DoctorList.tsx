'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { DoctorStaffResponse } from '@/types/api';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, Eye, UserPlus, Phone, Clock, Calendar, Award, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useReceptionDoctors } from '@/modules/reception/hooks/useReceptionDoctors';
import { getPrimaryDepartment, getPrimarySpecialization } from '@/utils/staffDisplay';
import { PageSurface } from '@/components/ui/PageSurface';
import { Modal } from '@/components/ui/Modal';

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

  const columns: Column<DoctorStaffResponse>[] = [
    {
      header: 'Doctor Name',
      mobilePosition: 'title',
      filterable: true,
      filterPlaceholder: 'Name...',
      render: (row) => (
          <div className="flex items-center justify-center text-center">
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
                className="p-2 text-slate-400 hover:text-[var(--primary)] transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm"
                title="View Schedule"
            >
              <Eye className="size-4" />
            </button>
            <Link
                href={`/reception/appointments/create?doctorId=${row.doctorId}`}
                className="p-2 text-slate-400 hover:text-[var(--primary)] transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm"
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
          <div className="space-y-6 py-4 md:py-6">
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] size-5" />
                  <input
                      className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all font-medium"
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
            </Card>
          </div>
        </PageSurface>

        <Modal
            isOpen={!!selectedDoctor}
            onClose={() => setSelectedDoctor(null)}
            title="Medical Professional Portfolio"
            width="850px"
        >
          {selectedDoctor && (
              <div className="flex flex-col bg-white overflow-hidden max-h-[85vh]">

                {/* Context Profile Bar */}
                <div className="p-6 border-b border-[var(--border)] bg-[var(--background)]/30 flex flex-wrap items-center gap-4">
                  <div className="size-14 rounded-2xl bg-[var(--primary)] text-white text-xl font-bold flex items-center justify-center uppercase">
                    {selectedDoctor.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight mb-1.5">
                      {selectedDoctor.fullName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-[var(--primary-light)] text-[var(--primary)] border-none px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {getPrimarySpecialization(selectedDoctor)}
                      </Badge>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    • {getPrimaryDepartment(selectedDoctor)}
                  </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-l border-[var(--border)] pl-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Consultation</span>
                      <span className="text-lg font-bold text-[var(--primary)]">₹{selectedDoctor.consultationFee}</span>
                    </div>
                  </div>
                </div>

                {/* Split Content Body */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 overflow-y-auto">

                  {/* Left Column: Metrics & Info */}
                  <div className="md:col-span-2 p-6 border-r border-[var(--border)] bg-[var(--background)]/10 space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                        <Phone className="size-3.5 text-[var(--primary)]" /> Contact Details
                      </h4>
                      <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                        <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Primary Phone</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedDoctor.phone}</p>
                      </div>
                      <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                        <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Medical License</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">REG-772910-B</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                        <Award className="size-3.5 text-[var(--primary)]" /> Qualifications
                      </h4>
                      <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                          <div className="size-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] shrink-0">
                            <BookOpen className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--text-primary)]">MD - Cardiology</p>
                            <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase">Stanford Medical School</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="size-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] shrink-0">
                            <Award className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--text-primary)]">Interventional Fellowship</p>
                            <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase">Mayo Clinic</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Schedule Slots */}
                  <div className="md:col-span-3 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="size-3.5 text-[var(--primary)]" /> Availability Windows
                      </h4>
                      <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <div className="size-1.5 bg-emerald-500 rounded-full"></div> Active
                      </div>
                    </div>

                    {/* Horizontal Date Track */}
                    <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--border)]">
                      {dateOptions.map((opt) => (
                          <button
                              key={opt.iso}
                              onClick={() => {
                                const cleanDate = opt.iso.split('T')[0];
                                setSelectedDate(cleanDate);
                              }}
                              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-2 border rounded-xl transition-all ${
                                  selectedDate?.split('T')[0] === opt.iso.split('T')[0]
                                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white font-bold'
                                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                              }`}
                          >
                            <span className="text-[8px] uppercase tracking-wide mb-0.5">{opt.label}</span>
                            <span className="text-sm font-bold">{opt.day}</span>
                          </button>
                      ))}
                    </div>

                    {/* Slots Matrix */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Select Consultation Window</p>
                        {loadingSchedule && <Clock className="size-3.5 text-[var(--primary)] animate-spin" />}
                      </div>

                      {loadingSchedule ? (
                          <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-14 bg-[var(--background)] border border-[var(--border)] rounded-xl animate-pulse" />
                            ))}
                          </div>
                      ) : availability.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {availability.map((slot, idx) => (
                                <div
                                    key={idx}
                                    className={`flex flex-col p-3 border rounded-xl transition-all ${
                                        slot.available
                                            ? 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]'
                                            : 'border-[var(--border)] bg-[var(--background)] opacity-50 grayscale'
                                    }`}
                                >
                                  <span className="text-xs font-bold text-[var(--text-primary)] mb-1">{slot.startTime} - {slot.endTime}</span>
                                  <span className={`text-[9px] font-medium ${slot.available ? 'text-emerald-600' : 'text-[var(--text-secondary)]'}`}>
                            {slot.available ? `${slot.maxPatients - slot.currentBookings} slots left` : 'Fully Booked'}
                          </span>
                                </div>
                            ))}
                          </div>
                      ) : (
                          <div className="py-8 text-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--background)]/40">
                            <Clock className="size-6 text-[var(--text-secondary)] opacity-40 mx-auto mb-2" />
                            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">No hours scheduled</p>
                          </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Flat Interface Actions Footer */}
                <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-end gap-3">
                  <button
                      onClick={() => setSelectedDoctor(null)}
                      className="px-5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-bold uppercase transition-all hover:bg-[var(--border)]"
                  >
                    Close
                  </button>
                  {selectedDoctor && (
                      <Link
                          href={`/reception/appointments/create?doctorId=${selectedDoctor.doctorId}`}
                          className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-xs font-bold uppercase transition-all hover:opacity-90 text-center"
                      >
                        Book Appointment
                      </Link>
                  )}
                </div>
              </div>
          )}
        </Modal>
      </MainLayout>
  );
}
