'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { AppointmentSummaryDTO } from '@/types/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatToken } from '@/utils/tokenHelper';
import { Modal } from '@/components/ui/Modal';
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
 * Component for Date Range filtering in the table header
 */
const DateRangeFilter = ({ 
  onFilter, 
  activeFilters 
}: { 
  onFilter: (key: string, value: string) => void, 
  activeFilters: Record<string, string> 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
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
          "w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg transition-all text-[10px] font-bold border",
          hasFilter 
            ? "bg-slate-50 text-slate-900 border-slate-400 shadow-sm" 
            : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
        )}
      >
        <span className="truncate">{label}</span>
        <span className="material-symbols-outlined text-[14px] shrink-0">calendar_month</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
          <div 
            className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[120] min-w-[280px] flex flex-col gap-4 normal-case tracking-normal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600">calendar_month</span>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={activeFilters.to ? dayjs(activeFilters.to).format('YYYY-MM-DDTHH:mm') : ''}
                  onChange={(e) => onFilter('to', e.target.value ? dayjs(e.target.value).toISOString() : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <Button 
              className="w-full shadow-lg shadow-orange-600/20 mt-2" 
              onClick={() => setIsOpen(false)}
            >
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
  const {
    appointments,
    loading,
    statusFilter,
    setStatusFilter,
    sortState,
    setSortState,
    columnFilters,
    setColumnFilters,
    isFilterModalOpen,
    setIsFilterModalOpen,
    advancedFilters,
    setAdvancedFilters,
    activeFilters,
    stats,
    applyFilters,
    resetFilters,
    removeFilter,
    refresh
  } = useReceptionAppointments();

  const columns: Column<AppointmentSummaryDTO>[] = [
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
          <span className="font-medium text-slate-900">
            {formatDateTime(app.appointmentTime)}
          </span>
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
          SCHEDULED: 'orange',
          PAYMENT_PENDING: 'orange',
          PAID: 'orange',
          VITALS_RECORDED: 'purple',
          CONSULTATION_STARTED: 'blue',
          PRESCRIPTION_FINALIZED: 'blue',
          COMPLETED: 'emerald',
          CANCELLED: 'red'
        };

        // If vitals are not recorded yet in initial statuses, explicitly show "Vitals Not Recorded"
        const isVitalsNotRecorded = ['SCHEDULED', 'PAYMENT_PENDING', 'PAID'].includes(app.status);
        const badgeText = isVitalsNotRecorded ? 'Vitals Not Recorded' : app.status.replace('_', ' ');

        return <Badge variant={variants[app.status] || 'slate'}>{badgeText}</Badge>;
      }
    },
    {
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      mobilePosition: 'action',
      render: (app) => {
        // Checking if vitals are already recorded or down the clinical pipeline
        const codeVitalsRecorded = [
          'VITALS_RECORDED',
          'CONSULTATION_STARTED',
          'PRESCRIPTION_FINALIZED',
          'COMPLETED'
        ].includes(app.status);

        // ✅ HIDE VITALS BUTTON IF STATUS IS 'COMPLETED' OR 'CANCELLED'
        const shouldShowVitalsButton = !['COMPLETED', 'CANCELLED'].includes(app.status);

        return (
            <div className="flex items-center justify-center gap-2">
              {shouldShowVitalsButton && (
                  <Button
                      size="sm"
                      icon="vital_signs"
                      onClick={() => router.push(`/reception/appointments/vitals?appointmentId=${app.id}`)}
                  >
                    {codeVitalsRecorded ? 'Edit Vitals' : 'Vitals'}
                  </Button>
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
  ];

  const statConfig = [
    { label: 'Total Today', value: stats.total, variant: 'slate', filter: 'ALL' },
    { label: 'In Progress', value: stats.inProgress, variant: 'emerald', filter: 'CONSULTATION_STARTED' },
    { label: 'Waiting Vitals', value: stats.waitingForVitals, variant: 'purple', filter: 'PAID' },
    { label: 'Completed', value: stats.completed, variant: 'emerald', filter: 'COMPLETED' },
    { label: 'Upcoming', value: stats.upcoming, variant: 'blue', filter: 'UPCOMING' },
  ];

  return (
      <MainLayout title="Appointments Dashboard" hideTitle>
        <PageSurface
            maxWidthClassName="max-w-[1600px]"
            backgroundClassName="bg-[#f8f9fb]"
            fontClassName="font-inter"
        >
          <div className="space-y-4 py-4 md:py-6 pb-24 flex flex-col min-h-[calc(100vh-120px)]">
            {/* Header Row with Compact Cards */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="shrink-0">
                <h1 className="font-manrope text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  Today's Appointments
                </h1>
                <p className="text-slate-500 font-bold mt-1 text-xs uppercase tracking-wider hidden md:block">
                  Real-time patient visit status
                </p>
              </div>

              {/* Compact Stats Grid */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                {statConfig.map((stat, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setStatusFilter(stat.filter as any);
                      if (activeFilters.statuses?.length) {
                        resetFilters();
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all shrink-0 active:scale-95",
                      statusFilter === stat.filter 
                        ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 shadow-sm'
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      statusFilter === stat.filter ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500'
                    )}>
                      <span className="material-symbols-outlined text-[18px]">
                        {statusFilter === stat.filter ? 'check_circle' : 'analytics'}
                      </span>
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-tighter mb-0.5",
                        statusFilter === stat.filter ? 'text-white/80' : 'text-slate-500'
                      )}>{stat.label}</span>
                      <span className={cn(
                        "text-base font-bold",
                        statusFilter === stat.filter ? 'text-white' : 'text-slate-900'
                      )}>{stat.value || 0}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Table Container - Growing to occupy space */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[500px]">
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

        {/* Floating Action Buttons */}
        <div className="fixed top-32 right-6 lg:top-32 lg:right-10 flex flex-col items-end gap-3 z-[100]">
          <Link
            href="/reception/appointments/create"
            className="group flex items-center h-14 w-14 hover:w-48 p-4 rounded-full bg-orange-600 text-white shadow-2xl transition-all duration-300 ease-in-out overflow-hidden active:scale-95 hover:scale-105"
          >
            <div className="flex items-center gap-3 min-w-max px-0.5">
              <span className="material-symbols-outlined text-2xl shrink-0">add</span>
              <span className="font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                New Visit
              </span>
            </div>
          </Link>

          <Link
            href="/reception/patients/create"
            className="group flex items-center h-14 w-14 hover:w-52 p-4 rounded-full bg-blue-600 text-white shadow-2xl transition-all duration-300 ease-in-out overflow-hidden active:scale-95 hover:scale-105"
          >
            <div className="flex items-center gap-3 min-w-max px-0.5">
              <span className="material-symbols-outlined text-2xl shrink-0">person_add</span>
              <span className="font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                New Patient
              </span>
            </div>
          </Link>
        </div>

        <Modal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            title="Filter Appointments"
            size="lg"
        >
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-500">Appointment Status</label>
              <div className="flex flex-wrap gap-2">
                {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                    <label key={option.value} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                        advancedFilters.statuses.includes(option.value)
                            ? 'bg-orange-700 text-white border-orange-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                    }`}>
                      <input
                          type="checkbox"
                          hidden
                          checked={advancedFilters.statuses.includes(option.value)}
                          onChange={(e) => {
                            const items = e.target.checked
                                ? [...advancedFilters.statuses, option.value]
                                : advancedFilters.statuses.filter(i => i !== option.value);
                            setAdvancedFilters({...advancedFilters, statuses: items});
                          }}
                      />
                      <span className="text-xs font-bold">{option.label}</span>
                    </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-500">Payment Status</label>
              <div className="flex flex-wrap gap-2">
                {['PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'].map(ps => (
                    <label key={ps} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                        advancedFilters.paymentStatuses.includes(ps)
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:blue-300'
                    }`}>
                      <input
                          type="checkbox"
                          hidden
                          checked={advancedFilters.paymentStatuses.includes(ps)}
                          onChange={(e) => {
                            const items = e.target.checked
                                ? [...advancedFilters.paymentStatuses, ps]
                                : advancedFilters.paymentStatuses.filter(i => i !== ps);
                            setAdvancedFilters({...advancedFilters, paymentStatuses: items});
                          }}
                      />
                      <span className="text-xs font-bold">{ps.replace('_', ' ')}</span>
                    </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={resetFilters}>Reset All</Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        </Modal>
      </MainLayout>
  );
};