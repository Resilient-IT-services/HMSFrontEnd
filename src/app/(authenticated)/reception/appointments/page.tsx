'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { AppointmentResponse, DoctorResponse, AppointmentStatus } from '@/types/api';
import { Plus, Filter, Search, User, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

const TodayAppointmentsPage = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [doctorFilter, setDoctorFilter] = useState<number | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const newAppointmentRef = useRef<HTMLButtonElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [aptRes, doctorRes] = await Promise.all([
        appointmentService.list(0, 100, debouncedSearchTerm),
        doctorService.list(0, 100)
      ]);

      if (aptRes.success && aptRes.data) {
        setAppointments(aptRes.data.content);
      }
      if (doctorRes.success && doctorRes.data) {
        setDoctors(doctorRes.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    newAppointmentRef.current?.focus();
  }, []);

  const handleStatusUpdate = async (id: number, status: AppointmentStatus) => {
    try {
      const res = await appointmentService.updateStatus(id, { status });
      if (res.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
    const matchesDoctor = doctorFilter === 'All' || apt.doctorId === doctorFilter;
    return matchesStatus && matchesDoctor;
  });

  const stats = {
    total: appointments.length,
    checkedIn: appointments.filter(a => a.status === 'CHECKED_IN').length,
    pending: appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length,
    done: appointments.filter(a => a.status === 'COMPLETED').length,
  };

  const columns = [
    { 
      header: 'Time', 
      accessor: (row: AppointmentResponse) => (
        <div className="flex items-center gap-2 font-black text-[var(--primary)]">
          <Clock className="size-3" />
          <span>{new Date(row.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    },
    { 
      header: 'Patient Name', 
      accessor: (row: AppointmentResponse) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-black text-xs uppercase">
            {row.patientName.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="font-bold text-[var(--text-primary)]">{row.patientName}</span>
        </div>
      )
    },
    { 
      header: 'Doctor', 
      accessor: (row: AppointmentResponse) => row.doctorName
    },
    { 
      header: 'Status', 
      accessor: (row: AppointmentResponse) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
          row.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700 border border-green-200' :
          row.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
          'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: AppointmentResponse) => (
        <div className="flex justify-end gap-2 items-center">
          {row.status !== 'CHECKED_IN' && row.status !== 'COMPLETED' && (
            <button 
              onClick={() => handleStatusUpdate(row.id, 'CHECKED_IN')}
              className="h-8 px-3 bg-[var(--primary)] text-white rounded-lg text-[10px] font-black uppercase hover:bg-[var(--primary-hover)] transition-all"
            >
              Check-in
            </button>
          )}
          <button className="h-8 px-3 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-[10px] font-black uppercase hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-all">
            Edit
          </button>
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Today's Appointments" hideTitle>
      <div className="flex flex-col gap-6">
        {/* Compact Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 -mt-10 mb-2">
           <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Today&apos;s Appointments</h2>
           <Link href="/reception/appointments/create">
            <button 
              ref={newAppointmentRef}
              className="group flex items-center gap-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all font-black text-sm uppercase tracking-wider focus:ring-4 focus:ring-[var(--primary-light)] outline-none"
            >
              <Plus className="size-5 stroke-[3]" />
              <span>New Appointment</span>
            </button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: 'Total', val: stats.total, color: 'text-[var(--text-secondary)]' },
            { label: 'Pending', val: stats.pending, color: 'text-amber-600' },
            { label: 'Done', val: stats.done, color: 'text-[var(--primary)]' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center justify-center px-6 py-2 bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl shadow-sm min-w-[100px]">
              <span className={`text-[10px] font-black uppercase tracking-widest ${s.color} opacity-70`}>{s.label}</span>
              <span className="text-xl font-black text-[var(--text-primary)] leading-tight">{s.val}</span>
            </div>
          ))}
          
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] size-5" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl focus:border-[var(--primary)] outline-none transition-all font-bold shadow-sm" 
              placeholder="Search by Patient or Doctor Name..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-[var(--surface)] border-2 border-[var(--border)] px-4 py-2 rounded-xl shadow-sm">
              <Filter className="size-3 text-[var(--text-secondary)]" />
              <select 
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="bg-transparent text-[10px] font-black uppercase text-[var(--text-secondary)] outline-none cursor-pointer"
              >
                <option value="All">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.fullName}</option>
                ))}
              </select>
           </div>

           <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
             {['All', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'].map(s => (
               <button 
                 key={s}
                 onClick={() => setStatusFilter(s)}
                 className={`flex items-center justify-center h-9 px-5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                   statusFilter === s 
                   ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/20' 
                   : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
                 }`}
               >
                 {s === 'All' ? 'All Status' : s.replace('_', ' ')}
               </button>
             ))}
           </div>
        </div>

        <Card className="p-0 overflow-hidden border-2">
          <Table 
            columns={columns} 
            data={filteredAppointments} 
            isLoading={loading} 
            onRowDoubleClick={(row) => router.push(`/reception/patients/${row.patientId}`)}
          />
        </Card>
      </div>
    </MainLayout>
  );
};

export default TodayAppointmentsPage;
