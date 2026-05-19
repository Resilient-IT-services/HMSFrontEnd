'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { DoctorStaffResponse } from '@/types/api';
import { Search, Filter, Stethoscope, UserPlus, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { useReceptionDoctors } from '@/modules/reception/hooks/useReceptionDoctors';
import { getPrimaryDepartment, getPrimarySpecialization } from '@/utils/staffDisplay';

export function DoctorList() {
  const {
    doctors,
    loading,
    searchTerm,
    setSearchTerm,
    selectedDepartment,
    setSelectedDepartment,
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
      render: (row) => (
        <span className="text-sm font-medium text-[var(--text-primary)]">{getPrimaryDepartment(row)}</span>
      )
    },
    { 
      header: 'Contact', 
      mobilePosition: 'body',
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
    <MainLayout title="Medical Staff">
      <div className="space-y-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
              />
           </Card>

           <div className="space-y-6">
              <Card className="p-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4 opacity-50 text-center">Duty Overview</h3>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--success-light)]/30 border border-[var(--success)]/10">
                       <span className="text-[10px] font-bold text-[var(--success)] uppercase">On Duty</span>
                       <span className="text-lg font-black text-[var(--text-primary)]">{doctors.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--warning-light)]/30 border border-[var(--warning)]/10">
                       <span className="text-[10px] font-bold text-[var(--warning)] uppercase">In Surgery</span>
                       <span className="text-lg font-black text-[var(--text-primary)]">0</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--error-light)]/30 border border-[var(--error)]/10">
                       <span className="text-[10px] font-bold text-[var(--error)] uppercase">Off Duty</span>
                       <span className="text-lg font-black text-[var(--text-primary)]">0</span>
                    </div>
                 </div>
              </Card>

              <Card className="bg-[var(--primary)] text-white overflow-hidden relative group p-5">
                 <div className="relative z-10">
                    <h4 className="text-base font-black uppercase italic leading-tight mb-2">Staff Roster</h4>
                    <p className="text-white/70 text-[10px] font-medium mb-4">Daily staff schedules are synced from HRMS.</p>
                    <button className="w-full py-2 bg-white/20 rounded-lg text-[10px] font-black uppercase hover:bg-white/30 transition-all">View Full</button>
                 </div>
                 <Stethoscope className="absolute -right-4 -bottom-4 size-24 text-white/10 group-hover:scale-110 transition-transform duration-500" />
              </Card>
           </div>
        </div>
      </div>

      {/* Doctor Schedule Modal */}
      <Modal 
        isOpen={!!selectedDoctor} 
        onClose={() => setSelectedDoctor(null)} 
        title={`Schedule: ${selectedDoctor?.fullName}`}
      >
        <div className="p-6 space-y-6">
           <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Department</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{getPrimaryDepartment(selectedDoctor)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Consultation Fee</p>
                <span className="text-sm font-bold text-orange-600 uppercase">₹{selectedDoctor?.consultationFee || '0'}</span>
              </div>
           </div>

           {/* Weekly Calendar View */}
           <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Weekly Schedule</h4>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {dateOptions.map((opt: any) => (
                  <button
                    key={opt.iso}
                    onClick={() => setSelectedDate(opt.iso)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-2 border-2 rounded-xl transition-all ${
                      selectedDate === opt.iso
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-slate-100 bg-white hover:border-orange-200'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase ${selectedDate === opt.iso ? 'text-orange-600' : 'text-slate-400'}`}>{opt.label}</span>
                    <span className={`text-base font-black ${selectedDate === opt.iso ? 'text-orange-600' : 'text-slate-900'}`}>{opt.day}</span>
                  </button>
                ))}
              </div>
           </div>

           <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Available Slots</h4>
              {loadingSchedule ? (
                <div className="py-10 text-center animate-pulse text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest">Fetching slots...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                  {availability.length === 0 ? (
                    <div className="col-span-2 py-10 text-center text-xs font-bold text-[var(--text-secondary)] uppercase border-2 border-dashed border-[var(--border)] rounded-xl">No available slots for this day</div>
                  ) : (
                    availability.map((session, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${session.available ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{session.startTime} - {session.endTime}</span>
                          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                            {session.available ? `${session.maxPatients - session.currentBookings} Left` : 'Full'}
                          </span>
                        </div>
                        {session.available && (
                          <Link 
                            href={`/reception/appointments/create?doctorId=${selectedDoctor?.doctorId}&date=${selectedDate}&time=${session.startTime}`}
                            className="p-1.5 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors"
                          >
                            <UserPlus className="size-3" />
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
           </div>

           <div className="pt-4 flex gap-3">
              <button onClick={() => setSelectedDoctor(null)} className="flex-1 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:bg-slate-50 transition-all">Close</button>
           </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
