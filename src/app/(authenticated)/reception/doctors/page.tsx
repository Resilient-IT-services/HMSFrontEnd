'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { DoctorStaffResponse, AppointmentResponse } from '@/types/api';
import { Search, Calendar, Clock, Filter, Stethoscope, UserPlus, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [doctorAppointments, setDoctorAppointments] = useState<AppointmentResponse[]>([]);
  const [loadingSchedule, setLoadingLoadingSchedule] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await doctorService.list(0, 100, debouncedSearchTerm);
      if (res.success && res.data) {
        setDoctors(res.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch doctors', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const viewSchedule = async (doctor: DoctorStaffResponse) => {
    setSelectedDoctor(doctor);
    try {
      setLoadingLoadingSchedule(true);
      // For now we use the global list and filter, in real app we'd have a specific doctor schedule API
      const res = await appointmentService.list(0, 500);
      if (res.success && res.data) {
        const schedule = res.data.content.filter(a => a.doctorId === doctor.userId);
        setDoctorAppointments(schedule);
      }
    } catch (error) {
      console.error('Failed to fetch schedule', error);
    } finally {
      setLoadingLoadingSchedule(false);
    }
  };

  const columns = [
    { 
      header: 'Doctor Name', 
      accessor: (row: DoctorStaffResponse) => (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-black uppercase">
            {row.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--text-primary)]">{row.fullName}</span>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">{row.specialization}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Department', 
      accessor: (row: DoctorStaffResponse) => (
        <span className="text-sm font-medium text-[var(--text-primary)]">{row.departmentName || 'General Medicine'}</span>
      )
    },
    { 
      header: 'Contact', 
      accessor: (row: DoctorStaffResponse) => row.phone 
    },
    {
      header: 'Actions',
      accessor: (row: DoctorStaffResponse) => (
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <Card className="md:col-span-3">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] size-5" />
                  <input 
                    className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all font-medium" 
                    placeholder="Search by Doctor Name, Specialization, or Department..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="px-6 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center gap-2 font-bold text-[var(--text-secondary)] hover:border-[var(--primary)] transition-all no-scrollbar">
                   <Filter className="size-4" />
                   All Departments
                </button>
              </div>

              <Table 
                columns={columns} 
                data={doctors} 
                isLoading={loading} 
                onRowDoubleClick={(row) => viewSchedule(row)}
              />
           </Card>

           <div className="space-y-6 lg:ml-auto lg:w-[70%]">
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
                <p className="text-sm font-bold text-[var(--text-primary)]">{selectedDoctor?.departmentName || 'General Medicine'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Status</p>
                <span className="text-xs font-bold text-green-600 uppercase">Available Today</span>
              </div>
           </div>

           <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Today&apos;s Slots</h4>
              {loadingSchedule ? (
                <div className="py-10 text-center animate-pulse text-[var(--text-secondary)]">Fetching appointments...</div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {doctorAppointments.length === 0 ? (
                    <div className="py-10 text-center text-xs font-bold text-[var(--text-secondary)] uppercase border-2 border-dashed border-[var(--border)] rounded-xl">No booked appointments for today</div>
                  ) : (
                    doctorAppointments.map(apt => (
                      <div key={apt.id} className="flex items-center gap-4 p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                        <div className="px-3 py-1 bg-[var(--primary-light)] text-[var(--primary)] rounded-lg text-xs font-black">
                          {new Date(apt.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[var(--text-primary)]">{apt.patientName}</p>
                          <p className="text-[10px] font-medium text-[var(--text-secondary)]">Regular Checkup</p>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          apt.status === 'COMPLETED' ? 'bg-[var(--success-light)] text-[var(--success)]' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
           </div>

           <div className="pt-4 flex gap-3">
              <button onClick={() => setSelectedDoctor(null)} className="flex-1 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:bg-slate-50 transition-all">Close</button>
              <Link 
                href={`/reception/appointments/create?doctorId=${selectedDoctor?.doctorId}`} 
                className="flex-1 btn-primary flex items-center justify-center"
              >
                Book New Slot
              </Link>
           </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default DoctorsPage;
