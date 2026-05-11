'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { Table, Column } from '@/components/ui/Table';
import { AppointmentResponse } from '@/types/api';
import { formatToken } from '@/utils/tokenHelper';
import { useDoctorQueue } from '@/modules/doctor/hooks/useDoctorQueue';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';

const PatientQueuePage = () => {
  const router = useRouter();
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
  } = useDoctorQueue();

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const columns: Column<AppointmentResponse>[] = [
    {
      header: 'TOKEN',
      render: (a) => (
        <span className={`font-bold ${a.status === 'WALK_IN' ? 'text-primary' : 'text-gray-900'}`}>
          #{formatToken(a)}
        </span>
      )
    },
    {
      header: 'PATIENT NAME',
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase border border-slate-100">
            {a.patientName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{a.patientName}</p>
            <p className="text-xs text-gray-500">Code: {(a as any).patientCode || 'N/A'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'AGE/GENDER',
      render: (a) => (
        <span className="text-slate-600 font-medium">
          {patientDetails[a.patientId] 
            ? `${calculateAge(patientDetails[a.patientId].dob)} / ${patientDetails[a.patientId].gender.charAt(0)}` 
            : '-- / --'}
        </span>
      )
    },
    {
      header: 'VISIT TIME',
      render: (a) => (
        <span className="text-slate-600 font-medium">
          {a.appointmentTime.split('T')[1]?.slice(0, 5) || '--:--'}
        </span>
      )
    },
    {
      header: 'STATUS',
      render: (a) => {
        const variants: Record<string, any> = {
          WALK_IN: 'orange',
          COMPLETED: 'emerald',
          SCHEDULED: 'blue',
          CANCELLED: 'red'
        };
        return <Badge variant={variants[a.status] || 'slate'}>{a.status.replace('_', ' ')}</Badge>;
      }
    },
    {
      header: 'ACTIONS',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end gap-2">
          {a.status === 'WALK_IN' ? (
            <Button size="sm" onClick={() => router.push(`/doctor/active-consultation?appointmentId=${a.id}`)}>Resume</Button>
          ) : a.status === 'COMPLETED' ? (
            <Badge variant="slate">Consulted</Badge>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => handleStartConsultation(a.id)}>Start Consultation</Button>
          )}
          <Button variant="ghost" size="sm" icon="history" title="View History" />
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Patient Queue" hideTitle>
      <div className="space-y-8 font-inter">
        
        <PageHeading 
          title="Patient Queue" 
          description={`Manage ${activeTab === 'TODAY' ? "today's" : "upcoming"} appointments and surgical consultations.`}
        >
          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
            <button 
              onClick={() => setActiveTab('TODAY')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'TODAY' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'UPCOMING' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Upcoming
            </button>
          </div>
        </PageHeading>

        {/* Status Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard label="Total Patients" value={stats.total} icon="group" variant="orange" />
          <MetricCard label="Waiting" value={stats.waiting} icon="hourglass_empty" variant="blue" />
          <MetricCard label="Walk-in" value={stats.inProgress} icon="clinical_notes" variant="orange" />
          <MetricCard label="Completed" value={stats.completed} icon="check_circle" variant="emerald" />
        </section>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full max-w-md">
            <SearchInput
              placeholder="Search patient by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon="refresh" isLoading={loading} onClick={() => refresh()}>Refresh</Button>
            <Button variant="secondary" icon="filter_list">Filter</Button>
          </div>
        </div>

        {/* Patient Table Section */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Queue List</h3>
              <Badge variant="emerald" className="animate-pulse">Live Queue</Badge>
            </div>
          </div>
          
          <Table 
            columns={columns} 
            data={appointments} 
            isLoading={loading}
            onRowDoubleClick={(a) => {
              if (a.status === 'WALK_IN') {
                router.push(`/doctor/active-consultation?appointmentId=${a.id}`);
              } else if (a.status !== 'COMPLETED') {
                handleStartConsultation(a.id);
              }
            }}
            loadingMessage="Loading queue..."
            emptyMessage="No patients in the queue for today."
          />

          <div className="px-6 py-4 bg-white border-t border-slate-50 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total <span className="text-slate-900">{appointments.length}</span> patients in current view
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon="chevron_left" disabled />
              <Button variant="secondary" size="sm" icon="chevron_right" disabled />
            </div>
          </div>
        </section>

        {/* Bottom Insights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
          <div className="md:col-span-2 bg-orange-50/50 p-8 rounded-2xl border border-orange-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-orange-900 uppercase text-sm tracking-tight">Next Surgery Scheduled</h4>
              <p className="text-orange-700 font-medium text-sm mt-1">Laparoscopic Cholecystectomy - 12:30 PM with Team Alpha</p>
            </div>
            <Button size="lg">View Details</Button>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Average Wait Time</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">18</span>
              <span className="text-sm font-bold text-slate-500 uppercase">mins</span>
            </div>
            <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_down</span>
              5% LOWER THAN YESTERDAY
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default PatientQueuePage;
