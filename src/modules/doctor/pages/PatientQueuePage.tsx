'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { Table, Column } from '@/components/ui/Table';
import { AppointmentResponse } from '@/types/api';
import { formatToken } from '@/utils/tokenHelper';
import { useDoctorQueue } from '@/modules/doctor/hooks/useDoctorQueue';
import { Button } from '@/components/ui/Button';
import { PageSurface } from '@/components/ui/PageSurface';

// Pharmacy Style Layout & Lucid Icons Components Integration
import {
  FileText, Hourglass, CheckCircle2,
  Search, RefreshCw, Eye, User, Clock, Filter
} from 'lucide-react';

export const PatientQueuePage = () => {
  const router = useRouter();
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState('ALL'); // Dropdown filter state tracking

  const {
    appointments,
    loading,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    stats,
    patientDetails,
    handleStartConsultation,
    refresh
  } = useDoctorQueue(columnFilters);

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Live Reactive Filter Engine (Dropdown Status Categories mapping helper)
  const filteredAppointments = useMemo(() => {
    let result = appointments;

    if (statusFilter !== 'ALL') {
      result = result.filter(app => {
        const currentStatus = app.status ? app.status.toUpperCase().trim() : '';
        const targetFilter = statusFilter.toUpperCase().trim();
        return currentStatus === targetFilter;
      });
    }

    return result;
  }, [appointments, statusFilter]);

  // Structured Columns layout matching exact Pharmacy table design specs
  const columns: Column<AppointmentResponse>[] = [
    {
      header: 'Token',
      render: (p) => (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
              p.status === 'CONSULTATION_STARTED' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
          }`}>
          {formatToken(p)}
        </span>
      )
    },
    {
      header: 'Patient Details',
      render: (p) => (
          <div>
            <p className="font-semibold text-slate-800">{p.patientName}</p>
            <p className="text-[10px] text-slate-400 font-normal">PID: {String((p as { patientCode?: string }).patientCode || 'N/A')}</p>
          </div>
      )
    },
    {
      header: 'Age/Gender',
      render: (p) => (
          <span className="font-medium text-slate-600 text-xs">
          {patientDetails[p.patientId]
              ? `${calculateAge(patientDetails[p.patientId].dob)} Yrs / ${patientDetails[p.patientId].gender.charAt(0)}`
              : '-- / --'}
        </span>
      )
    },
    {
      header: 'Visit Time',
      render: (p) => <span className="text-slate-500 font-medium text-xs">{p.appointmentTime.split('T')[1]?.slice(0, 5) || '--:--'}</span>
    },
    {
      header: 'Status',
      render: (p) => {
        const variants: Record<string, string> = {
          CONSULTATION_STARTED: 'bg-orange-50 text-orange-600 border border-orange-100',
          COMPLETED: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          SCHEDULED: 'bg-slate-50 text-slate-600 border border-slate-200',
          CANCELLED: 'bg-rose-50 text-rose-600 border border-rose-100',
          VITALS_RECORDED: 'bg-orange-50 text-orange-600 border border-orange-100'
        };

        return (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${variants[p.status] || 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
            {p.status?.replaceAll('_', ' ') || 'PENDING'}
          </span>
        );
      },
    },
    {
      header: 'Action',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (p) => (
          <div className="flex items-center justify-center gap-3">
            {p.status === 'CONSULTATION_STARTED' ? (
                <button
                    onClick={() => router.push(`/doctor/active-consultation?appointmentId=${p.id}`)}
                    className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-300 text-[11px] font-bold rounded-lg hover:bg-orange-100 transition-all shadow-sm"
                >
                  Resume
                </button>
            ) : (
                <button
                    onClick={() => handleStartConsultation(p.id)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all shadow-sm ${
                        p.status === 'COMPLETED'
                            ? 'bg-slate-50 text-slate-500 border-slate-300 hover:bg-slate-100'
                            : 'bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100'
                    }`}
                >
                  {p.status === 'COMPLETED' ? "Reopen" : "Start"}
                </button>
            )}
            <button
                onClick={() => router.push(`/doctor/history?patientId=${p.patientId}`)}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-lg transition-all shadow-sm"
                title="View History"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
      )
    }
  ];

  return (
      <MainLayout title="Patient Queue" hideTitle>
        <PageSurface
            maxWidthClassName="max-w-[1600px]"
            backgroundClassName="bg-[#F8FAFC]"
            fontClassName="font-inter"
        >
          <div className="space-y-6 p-4 md:p-8">

            {/* Pharmacy Style Layout Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-2">
              <div>
                <h1 className="text-xl font-bold text-slate-800">Patient Queue Panel</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manage {activeTab === 'TODAY' ? "today's" : 'upcoming'} appointments and clinical consultations registry.
                </p>
              </div>

              {/* Top Toolbar Sync Control */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Custom Sliding Tab Container */}
                <div className="flex border border-slate-200 bg-white p-1 rounded-xl shadow-sm">
                  {['TODAY', 'UPCOMING'].map((tab) => (
                      <button
                          key={tab}
                          onClick={() => setActiveTab(tab as 'TODAY' | 'UPCOMING')}
                          className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                              activeTab === tab ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                        {tab === 'TODAY' ? 'Today' : 'Upcoming'}
                      </button>
                  ))}
                </div>

                <button
                    onClick={() => refresh()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>

            {/* Dynamic 4-Column Structured Metric Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Total Patients<br />Registry</p>
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><User className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Patients<br />Waiting</p>
                  <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Hourglass className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.waiting}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Consultations<br />In Progress</p>
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Clock className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.inProgress}</h3>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug">Completed<br />Visits</p>
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-slate-800">{stats.completed}</h3>
                </div>
              </div>
            </div>

            {/* Master Table Structure Wrapper Layer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col min-h-[550px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" /> Queue Deployment List
                </h3>

                {/* Search input field zone with operational dropdown selector layout */}
                <div className="flex items-center gap-2">
                  <div className="relative text-xs w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search patient by name or ID..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none font-medium text-xs text-slate-700"
                    />
                  </div>

                  {/* FIXED DYNAMIC FILTER SELECTOR DROPDOWN (PAID REMOVED) */}
                  <div className="relative flex items-center bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all px-3 py-1.5 gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent outline-none text-xs font-bold uppercase cursor-pointer pr-1 appearance-none"
                        aria-label="Filter queue entries by status category"
                    >
                      <option value="ALL">ALL STATUSES</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="VITALS_RECORDED">VITALS RECORDED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Core Data Engine Viewport */}
              <div className="overflow-x-auto min-w-full flex-1">
                <Table
                    columns={columns}
                    data={filteredAppointments}
                    isLoading={loading}
                    onRowDoubleClick={(appointment) => handleStartConsultation(appointment.id)}
                    loadingMessage="Loading queue..."
                    emptyMessage="No patients in the queue matching criteria."
                    onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                    activeFilters={columnFilters}
                />
              </div>

              {/* Flat Table Responsive Footer */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total <span className="text-slate-900">{filteredAppointments.length}</span> patients in view
              </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" icon="chevron_left" disabled />
                  <Button variant="secondary" size="sm" icon="chevron_right" disabled />
                </div>
              </div>
            </div>

          </div>
        </PageSurface>
      </MainLayout>
  );
};