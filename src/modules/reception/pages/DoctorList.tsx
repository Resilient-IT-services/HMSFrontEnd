'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { DoctorStaffResponse } from '@/types/api';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, Eye, UserPlus, Phone, Clock, MapPin, Calendar, Award, BookOpen, Activity } from 'lucide-react';
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

      <Modal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title="Medical Professional Portfolio"
        width="850px"
      >
        {selectedDoctor && (
          <div className="flex flex-col h-full bg-[#fcfdfe]">
            {/* Ultra-Modern Profile Header */}
            <div className="relative overflow-hidden p-8 border-b border-slate-100 bg-white">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Activity className="size-48 text-orange-600 rotate-12" />
              </div>
              
              <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar with Glow Effect */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-orange-600 to-amber-400 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative size-32 md:size-40 rounded-[2.2rem] bg-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-2xl uppercase border-4 border-white">
                    {selectedDoctor.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="absolute -bottom-2 -right-2 size-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
                    <div className="size-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                      <Badge variant="orange" className="bg-orange-600/10 text-orange-700 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {getPrimarySpecialization(selectedDoctor)}
                      </Badge>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <MapPin className="size-3" /> {getPrimaryDepartment(selectedDoctor)}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                      {selectedDoctor.fullName}
                    </h3>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consultation</span>
                      <span className="text-2xl font-black text-orange-600">₹{selectedDoctor.consultationFee}</span>
                    </div>
                    <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</span>
                      <span className="text-2xl font-black text-slate-900">12+ <span className="text-sm text-slate-400">Yrs</span></span>
                    </div>
                    <div className="w-px h-10 bg-slate-100 hidden md:block"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</span>
                      <div className="flex items-center gap-1 text-2xl font-black text-slate-900">
                        4.9 <span className="material-symbols-outlined text-amber-400 text-xl fill-current">star</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0">
              {/* Sidebar Info */}
              <div className="lg:col-span-2 p-8 border-r border-slate-100 bg-slate-50/30 space-y-8">
                {/* Contact Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="size-3.5 text-orange-600" /> Professional Contact
                  </h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm group hover:border-orange-200 transition-colors">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Phone</p>
                      <p className="font-bold text-slate-900">{selectedDoctor.phone}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm group hover:border-orange-200 transition-colors">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Medical License</p>
                      <p className="font-bold text-slate-900">REG-772910-B</p>
                    </div>
                  </div>
                </div>

                {/* Professional Sections */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Award className="size-3.5 text-orange-600" /> Expertise & Education
                  </h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="size-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <BookOpen className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">MD - Cardiology</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Stanford Medical School</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Award className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Fellowship in Interventional Cardiology</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mayo Clinic</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Schedule Area */}
              <div className="lg:col-span-3 p-8 space-y-8 bg-white">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="size-3.5 text-orange-600" /> Operational Hours
                  </h4>
                  <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <div className="size-1.5 bg-emerald-500 rounded-full"></div> Available Now
                  </div>
                </div>

                {/* Date Slider */}
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                  {dateOptions.map((opt) => (
                    <button
                      key={opt.iso}
                      onClick={() => setSelectedDate(opt.iso)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-3 border-2 rounded-2xl transition-all duration-300 ${
                        selectedDate === opt.iso
                          ? 'border-orange-600 bg-orange-600 text-white shadow-xl shadow-orange-200 -translate-y-1'
                          : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <span className={`text-[9px] font-black uppercase mb-1 ${selectedDate === opt.iso ? 'text-orange-100' : 'text-slate-400'}`}>
                        {opt.label}
                      </span>
                      <span className="text-lg font-black tracking-tighter">
                        {opt.day}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Slots Grid */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultation Windows</p>
                    {loadingSchedule && <Activity className="size-4 text-orange-600 animate-spin" />}
                  </div>
                  
                  {loadingSchedule ? (
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : availability.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {availability.map((slot, idx) => (
                        <div 
                          key={idx}
                          className={`group relative overflow-hidden flex flex-col p-5 border rounded-[1.5rem] transition-all duration-300 ${
                            slot.available 
                              ? 'border-slate-100 bg-white hover:border-orange-400 hover:shadow-xl hover:shadow-orange-100 hover:-translate-y-1' 
                              : 'border-slate-50 bg-slate-50/50 opacity-60 grayscale'
                          }`}
                        >
                          <div className={`absolute top-0 right-0 p-2 transform translate-x-1 -translate-y-1 opacity-10 group-hover:scale-110 transition-transform ${slot.available ? 'text-orange-600' : 'text-slate-300'}`}>
                            <Clock className="size-12" />
                          </div>
                          <span className="text-sm font-black text-slate-900 mb-1">{slot.startTime} - {slot.endTime}</span>
                          <div className="flex items-center gap-1.5">
                            <div className={`size-1.5 rounded-full ${slot.available ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${slot.available ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {slot.available ? `${slot.maxPatients - slot.currentBookings} slots free` : 'Fully Booked'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                      <div className="size-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Clock className="size-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Operational Hours</p>
                      <p className="text-[10px] font-bold text-slate-300 mt-1">This professional is not available on this date.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Premium Footer */}
            <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="size-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                      {String.fromCodePoint(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trusted by 500+ Patients</p>
              </div>
               <button 
                onClick={() => setSelectedDoctor(null)}
                className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all duration-500 shadow-xl shadow-slate-200 hover:shadow-orange-200 active:scale-95"
               >
                 Close Portfolio
               </button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
