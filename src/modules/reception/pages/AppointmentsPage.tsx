'use client';

import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { AppointmentSummaryDTO } from '@/types/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatToken } from '@/utils/tokenHelper';
import { useReceptionAppointments } from '@/modules/reception/hooks/useReceptionAppointments';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { cn } from '@/lib/cn';
import { APPOINTMENT_STATUS_OPTIONS } from '@/utils/enumOptions';
import { formatDateTime } from '@/utils/formatters';
import dayjs from '@/lib/dayjs';
import { PageSurface } from '@/components/ui/PageSurface';

/**
 * 3D Glassmorphic Date Range Filter
 */
const DateRangeFilter = ({
                           onFilter,
                           activeFilters
                         }: {
  onFilter: (key: string, value: string) => void,
  activeFilters: Record<string, string>
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fromDate = activeFilters.from ? dayjs(activeFilters.from) : null;
  const toDate = activeFilters.to ? dayjs(activeFilters.to) : null;
  const hasFilter = !!(activeFilters.from || activeFilters.to);

  const label = fromDate && toDate
      ? `${fromDate.format('MMM D')} - ${toDate.format('MMM D')}`
      : 'Filter Date...';

  return (
      <div className="relative w-full">
        <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className={cn(
                "w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg transition-all text-[10px] font-bold border active:scale-95",
                hasFilter
                    ? "bg-slate-50 text-slate-900 border-slate-400 shadow-sm"
                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
            )}
        >
          <span className="truncate">{label}</span>
          <span className="material-symbols-outlined text-[14px] text-orange-500 shrink-0">calendar_month</span>
        </button>

        {isOpen && (
            <>
              <div className="fixed inset-0 z-[110] bg-slate-900/10 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
              <div
                  className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[120] min-w-[280px] flex flex-col gap-4 normal-case tracking-normal animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600 text-sm">calendar_month</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Date Range</span>
                  </div>
                  {hasFilter && (
                      <button
                          onClick={() => { onFilter('from', ''); onFilter('to', ''); setIsOpen(false); }}
                          className="text-[10px] font-bold text-orange-600 hover:underline"
                      >
                        Reset
                      </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">Start Date & Time</label>
                    <input
                        type="datetime-local"
                        value={activeFilters.from ? dayjs(activeFilters.from).format('YYYY-MM-DDTHH:mm') : ''}
                        onChange={(e) => onFilter('from', e.target.value ? dayjs(e.target.value).toISOString() : '')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">End Date & Time</label>
                    <input
                        type="datetime-local"
                        value={activeFilters.to ? dayjs(activeFilters.to).format('YYYY-MM-DDTHH:mm') : ''}
                        onChange={(e) => onFilter('to', e.target.value ? dayjs(e.target.value).toISOString() : '')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none transition-all"
                    />
                  </div>
                </div>

                <Button className="w-full shadow-lg shadow-orange-600/20 mt-2" onClick={() => setIsOpen(false)}>
                  Apply Range
                </Button>
              </div>
            </>
        )}
      </div>
  );
};

export const AppointmentsPage = () => {
  const router = useRouter();
  const [isOrangeHovered, setIsOrangeHovered] = useState(false);

  const {
    appointments,
    loading,
    statusFilter,
    setStatusFilter,
    sortState,
    setSortState,
    columnFilters,
    setColumnFilters,
    activeFilters,
    stats,
    resetFilters
  } = useReceptionAppointments();

  const columns: Column<AppointmentSummaryDTO>[] = useMemo(() => [
    {
      header: 'Token',
      mobilePosition: 'meta',
      sortable: true,
      filterable: true,
      sortKey: 'token',
      filterPlaceholder: 'Token...',
      render: (app) => <span className="font-bold text-slate-900">{formatToken(app)}</span>
    },
    {
      header: 'VISIT DATE & TIME',
      mobilePosition: 'title',
      sortable: true,
      filterable: true,
      sortKey: 'appointmentTime',
      renderFilter: (onFilter, activeFilters) => (
          <DateRangeFilter onFilter={onFilter} activeFilters={activeFilters} />
      ),
      render: (app) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{formatDateTime(app.appointmentTime)}</span>
          </div>
      )
    },
    {
      header: 'Patient',
      mobilePosition: 'subtitle',
      sortable: true,
      filterable: true,
      sortKey: 'patientName',
      filterPlaceholder: 'Patient name...',
      render: (app) => (
          <div>
            <p className="font-bold text-slate-900">{app.patientName}</p>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Code: {(app as any).patientCode || 'N/A'}</p>
          </div>
      )
    },
    {
      header: 'Doctor',
      mobilePosition: 'body',
      sortable: true,
      filterable: true,
      sortKey: 'doctor',
      filterPlaceholder: 'Filter doctor...',
      render: (app) => (
          <div>
            <p className="font-medium text-slate-700">{app.doctorName}</p>
            <p className="text-xs text-slate-500 uppercase font-bold">{app.doctorSpecialization}</p>
          </div>
      )
    },
    {
      header: 'Status',
      mobilePosition: 'meta',
      sortable: true,
      filterable: true,
      sortKey: 'status',
      filterType: 'select',
      filterOptions: APPOINTMENT_STATUS_OPTIONS,
      render: (app) => {
        const variants: Record<string, any> = {
          SCHEDULED: 'orange', PAYMENT_PENDING: 'orange', PAID: 'orange',
          VITALS_RECORDED: 'purple', CONSULTATION_STARTED: 'blue',
          PRESCRIPTION_FINALIZED: 'blue', COMPLETED: 'emerald', CANCELLED: 'red'
        };

        const isVitalsNotRecorded = ['SCHEDULED', 'PAYMENT_PENDING', 'PAID'].includes(app.status);
        const badgeText = isVitalsNotRecorded ? 'Vitals Not Recorded' : app.status.replace('_', ' ');

        return (
            <div className="shadow-sm inline-block">
              <Badge variant={variants[app.status] || 'slate'}>{badgeText}</Badge>
            </div>
        );
      }
    },
    {
      header: 'Actions',
      headerClassName: 'text-right pr-4',
      className: 'text-right pr-4',
      mobilePosition: 'action',
      render: (app) => {
        const isVitalsNotRecorded = ['SCHEDULED', 'PAYMENT_PENDING', 'PAID'].includes(app.status);
        const isVitalsRecorded = app.status === 'VITALS_RECORDED';
        const isConsultationOrFinalized = [
          'CONSULTATION_STARTED', 'PRESCRIPTION_FINALIZED', 'COMPLETED', 'CANCELLED'
        ].includes(app.status);

        const shouldShowVitalsButton = !isConsultationOrFinalized;
        const vitalsButtonText = isVitalsNotRecorded ? 'Edit Vitals' : isVitalsRecorded ? 'View Vitals' : 'Vitals';

        return (
            <div className="flex items-center justify-end gap-2 w-full">
              {shouldShowVitalsButton && (
                  <button
                      onClick={() => router.push(`/reception/appointments/vitals?appointmentId=${app.id}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 h-9 rounded-full bg-orange-600 text-white shadow-md hover:bg-orange-700 shadow-[0_3px_8px_rgba(234,88,12,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all active:scale-95 text-xs font-black uppercase tracking-wider select-none border-none outline-none"
                  >
                    <span className="material-symbols-outlined text-sm font-bold leading-none">vital_signs</span>
                    <span>{vitalsButtonText}</span>
                  </button>
              )}
              <Button
                  variant="secondary"
                  size="sm"
                  icon="visibility"
                  onClick={() => router.push(`/reception/billing?appointmentId=${app.id}`)}
              >
                View
              </Button>
            </div>
        );
      }
    }
  ], [router]);

  const statConfig = [
    { label: 'Total Today', value: stats.total, filter: 'ALL', icon: 'analytics', colorClass: 'from-slate-700 to-slate-800 border-slate-900 shadow-slate-900/5' },
    { label: 'In Progress', value: stats.inProgress, filter: 'CONSULTATION_STARTED', icon: 'check_circle', colorClass: 'from-blue-600 to-blue-700 border-blue-800 shadow-blue-600/5' },
    { label: 'Completed', value: stats.completed, filter: 'COMPLETED', icon: 'check_circle', colorClass: 'from-emerald-600 to-emerald-700 border-emerald-800 shadow-emerald-600/5' },
    { label: 'Upcoming', value: stats.upcoming, filter: 'UPCOMING', icon: 'analytics', colorClass: 'from-indigo-600 to-indigo-700 border-indigo-800 shadow-indigo-600/5' },
  ];

  const handleTabClick = (filterType: string) => {
    setStatusFilter(filterType as any);
    setColumnFilters((prev) => ({
      ...prev,
      from: filterType === 'UPCOMING' ? dayjs().add(1, 'day').startOf('day').toISOString() : dayjs().startOf('day').toISOString(),
      to: filterType === 'UPCOMING' ? dayjs().add(30, 'days').endOf('day').toISOString() : dayjs().endOf('day').toISOString(),
    }));
    if (activeFilters.statuses?.length) resetFilters();
  };

  return (
      <MainLayout title="Appointments Dashboard" hideTitle>
        {/* Laser Light Animation Styles Injection */}
        <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine-laser {
          0% { transform: translateX(-150%) skewX(-25deg); }
          100% { transform: translateX(150%) skewX(-25deg); }
        }
        .animate-shine-laser {
          position: relative;
          overflow: hidden;
        }
        .animate-shine-laser::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
          transform: translateX(-150%) skewX(-25deg);
          animation: shine-laser 2s infinite ease-in-out;
        }
      `}} />

        <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
          <div className="space-y-4 py-2 md:py-4 pb-12 flex flex-col min-h-[calc(100vh-120px)]">

            {/* Header Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="shrink-0">
                <h1 className="font-manrope text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  Today's Appointments
                </h1>
                <p className="text-slate-500 font-bold mt-1 text-xs uppercase tracking-wider hidden md:block">
                  Real-time patient visit status
                </p>
              </div>

              {/* Premium 3D Tab Controls */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                {statConfig.map((stat, i) => {
                  const isActive = statusFilter === stat.filter;
                  return (
                      <button
                          key={i}
                          onClick={() => handleTabClick(stat.filter)}
                          className={cn(
                              "flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all shrink-0 active:scale-95",
                              isActive
                                  ? cn("bg-gradient-to-b text-white shadow-lg shadow-orange-600/20", stat.colorClass)
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 shadow-sm'
                          )}
                      >
                        <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]",
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500'
                        )}>
                          <span className="material-symbols-outlined text-[16px]">{stat.icon}</span>
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                      <span className={cn(
                          "text-[9px] font-black uppercase tracking-tighter mb-0.5",
                          isActive ? 'text-white/80' : 'text-slate-500'
                      )}>{stat.label}</span>
                          <span className={cn("text-sm font-bold", isActive ? 'text-white' : 'text-slate-900')}>
                        {stat.value || 0}
                      </span>
                        </div>
                      </button>
                  );
                })}
              </div>
            </div>

            {/* Table Container Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[500px] overflow-hidden">
              <Table
                  columns={columns}
                  data={appointments}
                  isLoading={loading}
                  onRowDoubleClick={(app) => app.status !== 'COMPLETED' && router.push(`/reception/appointments/vitals?appointmentId=${app.id}`)}
                  emptyMessage="No appointments found for today."
                  onSort={(key, dir) => setSortState(dir ? { key, direction: dir } : null)}
                  activeSort={sortState}
                  onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                  activeFilters={columnFilters}
              />
            </div>
          </div>
        </PageSurface>

        {/* NEXT LEVEL SHINING LASER CONTROL FLOATER CAPSULE */}
        <div className="fixed bottom-6 right-6 flex flex-row items-center gap-3 z-[100] bg-gradient-to-b from-slate-900 to-black border border-slate-800 p-2.5 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300">

          {/* New Patient Button (Laser Shimmer + Pulse Aura) */}
          <Link
              href="/reception/patients/create"
              className={cn(
                  "animate-shine-laser flex items-center justify-center h-12 p-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all duration-300 ease-out overflow-hidden active:scale-95 no-underline decoration-transparent select-none border-none shadow-[0_4px_12px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:brightness-110",
                  isOrangeHovered ? "w-12" : "w-44"
              )}
          >
            <div className="flex items-center justify-center gap-2.5 min-w-max">
              <div className="flex items-center justify-center w-6 h-6 shrink-0">
                <span className="material-symbols-outlined text-xl font-bold">person_add</span>
              </div>
              <span className={cn(
                  "font-bold text-xs whitespace-nowrap uppercase tracking-wider transition-all duration-300 ease-out no-underline decoration-transparent",
                  isOrangeHovered ? "opacity-0 max-w-0" : "opacity-100 max-w-[120px]"
              )}>
              New Patient
            </span>
            </div>
          </Link>

          {/* New Visit Button (Laser Shimmer + Orange Aura Glow) */}
          <Link
              href="/reception/appointments/create"
              onMouseEnter={() => setIsOrangeHovered(true)}
              onMouseLeave={() => setIsOrangeHovered(false)}
              className="animate-shine-laser group flex items-center justify-center h-12 w-12 hover:w-40 p-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white transition-all duration-300 ease-out overflow-hidden active:scale-95 no-underline decoration-transparent select-none border-none shadow-[0_4px_12px_rgba(234,88,12,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] hover:brightness-110"
          >
            <div className="flex items-center justify-center gap-2.5 min-w-max">
              <div className="flex items-center justify-center w-6 h-6 shrink-0">
                <span className="material-symbols-outlined text-xl font-bold">add</span>
              </div>
              <span className="font-bold text-xs whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[100px] transition-all duration-300 ease-out uppercase tracking-wider no-underline decoration-transparent">
              New Visit
            </span>
            </div>
          </Link>
        </div>
      </MainLayout>
  );
};