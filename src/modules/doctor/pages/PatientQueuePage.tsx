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
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { MetricsGrid } from '@/components/ui/MetricsGrid';
import { PageSurface } from '@/components/ui/PageSurface';

export const PatientQueuePage = () => {
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
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const columns: Column<AppointmentResponse>[] = [
    {
      header: 'TOKEN',
      render: (appointment) => (
        <span className={`font-bold ${appointment.status === 'WALK_IN' ? 'text-primary' : 'text-gray-900'}`}>
          #{formatToken(appointment)}
        </span>
      )
    },
    {
      header: 'PATIENT NAME',
      render: (appointment) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-100 font-bold uppercase text-slate-400">
            {appointment.patientName.split(' ').map((name) => name[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{appointment.patientName}</p>
            <p className="text-xs text-gray-500">Code: {String((appointment as { patientCode?: string }).patientCode || 'N/A')}</p>
          </div>
        </div>
      )
    },
    {
      header: 'AGE/GENDER',
      render: (appointment) => (
        <span className="font-medium text-slate-600">
          {patientDetails[appointment.patientId]
            ? `${calculateAge(patientDetails[appointment.patientId].dob)} / ${patientDetails[appointment.patientId].gender.charAt(0)}`
            : '-- / --'}
        </span>
      )
    },
    {
      header: 'VISIT TIME',
      render: (appointment) => (
        <span className="font-medium text-slate-600">
          {appointment.appointmentTime.split('T')[1]?.slice(0, 5) || '--:--'}
        </span>
      )
    },
    {
      header: 'STATUS',
      render: (appointment) => {
        const variants: Record<string, 'orange' | 'emerald' | 'blue' | 'red' | 'slate'> = {
          WALK_IN: 'orange',
          COMPLETED: 'emerald',
          SCHEDULED: 'blue',
          CANCELLED: 'red'
        };
        return <Badge variant={variants[appointment.status] || 'slate'}>{appointment.status.replace('_', ' ')}</Badge>;
      }
    },
    {
      header: 'ACTIONS',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (appointment) => (
        <div className="flex justify-end gap-2">
          {appointment.status === 'WALK_IN' ? (
            <Button size="sm" onClick={() => router.push(`/doctor/active-consultation?appointmentId=${appointment.id}`)}>Resume</Button>
          ) : appointment.status === 'COMPLETED' ? (
            <Badge variant="slate">Consulted</Badge>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => handleStartConsultation(appointment.id)}>Start Consultation</Button>
          )}
          <Button variant="ghost" size="sm" icon="history" title="View History" />
        </div>
      )
    }
  ];

  const metricItems = [
    { label: 'Total Patients', value: stats.total, icon: 'group', variant: 'orange' as const },
    { label: 'Waiting', value: stats.waiting, icon: 'hourglass_empty', variant: 'blue' as const },
    { label: 'Walk-in', value: stats.inProgress, icon: 'clinical_notes', variant: 'orange' as const },
    { label: 'Completed', value: stats.completed, icon: 'check_circle', variant: 'emerald' as const }
  ];

  const queueFooter = (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Total <span className="text-slate-900">{appointments.length}</span> patients in current view
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon="chevron_left" disabled />
        <Button variant="secondary" size="sm" icon="chevron_right" disabled />
      </div>
    </div>
  );

  return (
    <MainLayout title="Patient Queue" hideTitle>
      <PageSurface contentClassName="space-y-8" fontClassName="font-inter" fullBleed={false}>
        <PageHeading
          title="Patient Queue"
          description={`Manage ${activeTab === 'TODAY' ? "today's" : 'upcoming'} appointments and surgical consultations.`}
        >
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {['TODAY', 'UPCOMING'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'TODAY' | 'UPCOMING')}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${activeTab === tab ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tab === 'TODAY' ? 'Today' : 'Upcoming'}
              </button>
            ))}
          </div>
        </PageHeading>

        <MetricsGrid items={metricItems} className="grid-cols-1 md:grid-cols-4" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="w-full max-w-md">
            <SearchInput
              placeholder="Search patient by name or ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon="refresh" isLoading={loading} onClick={() => refresh()}>Refresh</Button>
            <Button variant="secondary" icon="filter_list">Filter</Button>
          </div>
        </div>

        <ContentPanel
          toolbar={(
            <div className="flex items-center justify-between bg-slate-50/30 px-6 py-4">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Queue List</h3>
                <Badge variant="emerald" className="animate-pulse">Live Queue</Badge>
              </div>
            </div>
          )}
          toolbarClassName="p-0"
          footer={queueFooter}
          footerClassName="p-0"
        >
          <Table
            columns={columns}
            data={appointments}
            isLoading={loading}
            onRowDoubleClick={(appointment) => {
              if (appointment.status === 'WALK_IN') {
                router.push(`/doctor/active-consultation?appointmentId=${appointment.id}`);
              } else if (appointment.status !== 'COMPLETED') {
                handleStartConsultation(appointment.id);
              }
            }}
            loadingMessage="Loading queue..."
            emptyMessage="No patients in the queue for today."
          />
        </ContentPanel>

        <section className="grid grid-cols-1 gap-6 pb-8 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/50 p-8 md:col-span-2">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-tight text-orange-900">Next Surgery Scheduled</h4>
              <p className="mt-1 text-sm font-medium text-orange-700">Laparoscopic Cholecystectomy - 12:30 PM with Team Alpha</p>
            </div>
            <Button size="lg">View Details</Button>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Average Wait Time</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">18</span>
              <span className="text-sm font-bold uppercase text-slate-500">mins</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[65%] rounded-full bg-orange-500" />
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="material-symbols-outlined text-xs">trending_down</span>
              5% LOWER THAN YESTERDAY
            </p>
          </div>
        </section>
      </PageSurface>
    </MainLayout>
  );
};
