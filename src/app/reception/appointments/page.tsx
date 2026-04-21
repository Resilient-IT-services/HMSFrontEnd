'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { AppointmentResponse, DoctorResponse, AppointmentStatus } from '@/types/api';
import { Plus, Filter } from 'lucide-react';
import Link from 'next/link';

const TodayAppointmentsPage = () => {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [doctorFilter, setDoctorFilter] = useState<number | 'All'>('All');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [aptRes, doctorRes] = await Promise.all([
        appointmentService.list(0, 100),
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <span className="font-semibold text-[var(--primary)]">
          {new Date(row.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    { 
      header: 'Patient Name', 
      accessor: (row: AppointmentResponse) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs uppercase">
            {row.patientName.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="font-medium text-[var(--text-primary)]">{row.patientName}</span>
        </div>
      )
    },
    { header: 'Doctor', accessor: 'doctorName' },
    { 
      header: 'Status', 
      accessor: (row: AppointmentResponse) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          row.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' :
          row.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
          'bg-blue-100 text-blue-700'
        }`}>
          <span className={`size-1.5 rounded-full ${
            row.status === 'CHECKED_IN' ? 'bg-green-500' :
            row.status === 'COMPLETED' ? 'bg-slate-400' :
            'bg-blue-500'
          }`}></span>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: AppointmentResponse) => (
        <div className="flex justify-end gap-2">
          {row.status !== 'CHECKED_IN' && row.status !== 'COMPLETED' && (
            <button 
              onClick={() => handleStatusUpdate(row.id, 'CHECKED_IN')}
              className="h-9 px-4 bg-[var(--primary)] text-white rounded-lg text-sm font-bold hover:bg-[var(--primary-hover)] transition-colors"
            >
              Check-in
            </button>
          )}
          {row.status === 'CHECKED_IN' && (
             <button disabled className="h-9 px-4 bg-slate-100 text-slate-400 rounded-lg text-sm font-bold cursor-not-allowed">
               Checked-in
             </button>
          )}
          <button className="h-9 px-4 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-sm font-bold hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
            Reschedule
          </button>
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Today's Appointments">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[var(--text-secondary)] font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Total', val: stats.total, color: 'text-[var(--text-secondary)]' },
              { label: 'Checked-in', val: stats.checkedIn, color: 'text-green-600' },
              { label: 'Pending', val: stats.pending, color: 'text-amber-500' },
              { label: 'Done', val: stats.done, color: 'text-[var(--primary)]' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center justify-center px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm min-w-[100px]">
                <span className={`text-xs font-bold uppercase tracking-wider ${s.color}`}>{s.label}</span>
                <span className="text-xl font-black text-[var(--text-primary)]">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'].map(s => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex h-10 shrink-0 items-center justify-center px-6 rounded-full font-bold transition-all ${
                  statusFilter === s 
                  ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20' 
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
                }`}
              >
                {s === 'All' ? 'All Appointments' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <Filter className="size-4 text-[var(--text-secondary)]" />
            <select 
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm font-bold text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
            >
              <option value="All">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        <Card>
          <Table columns={columns} data={filteredAppointments} isLoading={loading} />
        </Card>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8">
          <Link href="/reception/appointments/create" className="flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
            <Plus className="size-6" />
            <span className="font-black uppercase tracking-tight">New Appointment</span>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default TodayAppointmentsPage;
