'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
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
import { APPOINTMENT_STATUS_OPTIONS, ADMISSION_STATUS_OPTIONS } from '@/utils/enumOptions';
import { formatDateTime } from '@/utils/formatters';
import dayjs from '@/lib/dayjs';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { useIpd } from '@/modules/ipd/hooks/useIpd';
import { AdmissionResponseDTO, AdmissionStatus } from '@/types/ipd';
import AdmitPatientModal from '@/modules/ipd/components/AdmitPatientModal';

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
    ? (fromDate.isSame(toDate, 'day')
      ? `📅 ${fromDate.format('DD MMM YYYY')}`
      : `📅 ${fromDate.format('DD MMM')} - ${toDate.format('DD MMM')}`)
    : '📅 Date Range';

  return (
      <div className="relative">
        <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold active:scale-95 whitespace-nowrap",
                hasFilter
                    ? "bg-white text-slate-900 border-orange-300 shadow-sm hover:border-orange-400"
                    : "bg-white text-slate-500 border-slate-200 hover:border-orange-400 hover:text-slate-700 shadow-sm"
            )}
        >
          <span>{label}</span>
        </button>

        {isOpen && (
            <>
              <div className="fixed inset-0 z-[110] bg-slate-900/10 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
              <div
                  className="absolute top-full right-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[120] min-w-[280px] flex flex-col gap-4 normal-case tracking-normal animate-in fade-in slide-in-from-top-2 duration-150"
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">Start Date</label>
                    <input
                        type="date"
                        value={activeFilters.from ? dayjs(activeFilters.from).format('YYYY-MM-DD') : ''}
                        onChange={(e) => onFilter('from', e.target.value ? dayjs(e.target.value).startOf('day').toISOString() : '')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">End Date</label>
                    <input
                        type="date"
                        value={activeFilters.to ? dayjs(activeFilters.to).format('YYYY-MM-DD') : ''}
                        onChange={(e) => onFilter('to', e.target.value ? dayjs(e.target.value).endOf('day').toISOString() : '')}
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
  const [isIpdAdmissionHovered, setIsIpdAdmissionHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<'opd' | 'ipd'>('opd');

  // ── OPD data ─────────────────────────────────────────────────────────────
  const {
    appointments: rawAppointments,
    loading,
    statusFilter,
    setStatusFilter,
    sortState,
    setSortState,
    columnFilters,
    setColumnFilters,
    activeFilters,
    resetFilters,
    refresh
  } = useReceptionAppointments();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hospitalTimezone = useSelector((state: RootState) => state.auth.hospitalTimezone);
  const { isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);

  // ── IPD data ─────────────────────────────────────────────────────────────
  const { admissions, loading: ipdLoading, fetchAdmissions, updateStatus } = useIpd();
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [ipdSearchTerm, setIpdSearchTerm] = useState('');

  const isAdmin = isSuperMode || activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN';

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  useEffect(() => {
    if (activeTab === 'ipd') {
      fetchAdmissions();
    }
  }, [activeTab, fetchAdmissions]);

  // ── IPD derived state ─────────────────────────────────────────────────────
  const { totalTodayIpdAdmissions, admittedIpdCount, dischargedTodayIpdCount } = useMemo(() => {
    const content = admissions?.content || [];
    const now = hospitalTimezone ? dayjs().tz(hospitalTimezone) : dayjs();
    const todayStart = now.startOf('day').valueOf();
    const todayEnd = now.endOf('day').valueOf();

    const todayAdmissions = content.filter(a => {
      const admDate = dayjs(a.admissionDateTime).valueOf();
      return admDate >= todayStart && admDate <= todayEnd;
    });

    return {
      totalTodayIpdAdmissions: todayAdmissions,
      admittedIpdCount: content.filter(a => a.status === 'ADMITTED'),
      dischargedTodayIpdCount: todayAdmissions.filter(a => a.status === 'DISCHARGED'),
    };
  }, [admissions, hospitalTimezone]);

  // ── OPD derived state ─────────────────────────────────────────────────────
  const { totalTodayAppointments, completedAppointments, upcomingAppointments } = useMemo(() => {
    const now = hospitalTimezone ? dayjs().tz(hospitalTimezone) : dayjs();
    const todayStart = now.startOf('day').valueOf();
    const todayEnd = now.endOf('day').valueOf();
    const tomorrowStart = now.add(1, 'day').startOf('day').valueOf();
    const futureEnd = now.add(30, 'days').endOf('day').valueOf();

    const upcomingAllowedStatuses = new Set(['SCHEDULED', 'PAYMENT_PENDING', 'PAID', 'VITALS_RECORDED']);

    const today = rawAppointments.filter(app => {
      const appDate = dayjs(app.appointmentTime).valueOf();
      return appDate >= todayStart && appDate <= todayEnd;
    });

    const completed = today.filter(app => app.status === 'COMPLETED');

    const upcoming = rawAppointments.filter(app => {
      const appDate = dayjs(app.appointmentTime).valueOf();
      return appDate >= tomorrowStart &&
             appDate <= futureEnd &&
             upcomingAllowedStatuses.has(app.status);
    });

    return {
      totalTodayAppointments: today,
      completedAppointments: completed,
      upcomingAppointments: upcoming
    };
  }, [rawAppointments, hospitalTimezone]);

  const displayAppointments = useMemo(() => {
    if (statusFilter === 'UPCOMING') return upcomingAppointments;
    if (statusFilter === 'COMPLETED') return completedAppointments;
    return totalTodayAppointments;
  }, [statusFilter, totalTodayAppointments, completedAppointments, upcomingAppointments]);

  // ── OPD columns ───────────────────────────────────────────────────────────
  const columns: Column<AppointmentSummaryDTO>[] = useMemo(() => [
    {
      header: 'Token',
      mobilePosition: 'meta',
      sortable: true,
      sortKey: 'tokenNumber',
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
      sortKey: 'doctorName',
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

  // ── IPD helpers ───────────────────────────────────────────────────────────
  const getIpdStatusVariant = (status: AdmissionStatus) => {
    switch (status) {
      case 'ADMITTED': { return 'orange'; }
      case 'DISCHARGED': { return 'emerald'; }
      case 'CANCELLED': { return 'red'; }
      default: { return 'slate'; }
    }
  };

  const ipdColumns: Column<AdmissionResponseDTO>[] = [
    {
      header: 'Admission #',
      key: 'admissionNumber',
      render: (row) => <span className="font-bold text-slate-900">{row.admissionNumber}</span>
    },
    {
      header: 'Patient',
      key: 'patientName',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{row.patientName}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{row.patientId.substring(0, 8)}</span>
        </div>
      )
    },
    {
      header: 'Ward / Bed',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant="blue" className="rounded-md">{row.wardName}</Badge>
          <span className="font-bold text-slate-700">Bed: {row.bedNumber}</span>
        </div>
      )
    },
    {
      header: 'Doctor',
      key: 'doctorName',
      render: (row) => <span className="text-slate-600 font-medium">Dr. {row.doctorName}</span>
    },
    {
      header: 'Admitted At',
      key: 'admissionDateTime',
      render: (row) => <span className="text-slate-500">{formatDateTime(row.admissionDateTime)}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={getIpdStatusVariant(row.status)}>
          {ADMISSION_STATUS_OPTIONS.find(opt => opt.value === row.status)?.label || row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon="visibility"
            className="h-7 w-7 p-0"
            onClick={() => router.push(`/ipd/admissions/${row.id}`)}
          />
          {row.status === 'ADMITTED' && (
            <Button
              variant="secondary"
              size="sm"
              className="text-[10px] h-7"
              onClick={() => updateStatus(row.id, 'DISCHARGED')}
            >
              Discharge
            </Button>
          )}
        </div>
      )
    }
  ];

  // ── Stat tabs (switches between OPD and IPD) ──────────────────────────────
  const statConfig = activeTab === 'ipd' ? [
    { label: 'Total Today', value: totalTodayIpdAdmissions.length, filter: 'ALL', icon: 'hotel', colorClass: 'from-slate-700 to-slate-800 border-slate-900 shadow-slate-900/5' },
    { label: 'Admitted', value: admittedIpdCount.length, filter: 'ADMITTED', icon: 'bed', colorClass: 'from-orange-600 to-orange-700 border-orange-800 shadow-orange-600/5' },
    { label: 'Discharged', value: dischargedTodayIpdCount.length, filter: 'DISCHARGED', icon: 'check_circle', colorClass: 'from-emerald-600 to-emerald-700 border-emerald-800 shadow-emerald-600/5' },
  ] : [
    { label: 'Total Today', value: totalTodayAppointments.length, filter: 'ALL', icon: 'analytics', colorClass: 'from-slate-700 to-slate-800 border-slate-900 shadow-slate-900/5' },
    { label: 'Completed', value: completedAppointments.length, filter: 'COMPLETED', icon: 'check_circle', colorClass: 'from-emerald-600 to-emerald-700 border-emerald-800 shadow-emerald-600/5' },
    { label: 'Upcoming', value: upcomingAppointments.length, filter: 'UPCOMING', icon: 'analytics', colorClass: 'from-indigo-600 to-indigo-700 border-indigo-800 shadow-indigo-600/5' },
  ];

  const handleTabClick = (filterType: string) => {
    setStatusFilter(filterType as any);
    if (activeFilters.statuses?.length) {
      resetFilters();
    }
  };

  const tabs = [
    { key: 'opd', label: 'OPD', icon: 'calendar_today' },
    { key: 'ipd', label: 'IPD', icon: 'hotel' },
  ] as const;

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

        {/* ── Unified page header (always visible) ── */}
        <div className="bg-[#f8f9fb] px-4 pt-4 md:px-6 md:pt-6">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-2">

            {/* ROW 1: Title + Stat Cards */}
            <div className="flex flex-row items-center justify-between">
              <h1 className="font-manrope text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                Today's Appointments
              </h1>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
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

            {/* ROW 2: Subtitle */}
            <div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">
                Real-time patient visit status
              </p>
            </div>

            {/* ROW 3: OPD / IPD Tab Buttons */}
            <div>
              <div className="inline-flex gap-0.5 bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center justify-center gap-1 px-3 py-1 rounded-lg font-manrope font-black text-[11px] uppercase tracking-wide transition-all duration-200 active:scale-[0.98]",
                      activeTab === tab.key
                        ? "bg-orange-600 text-white shadow-sm shadow-orange-600/30"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span
                      className="material-symbols-outlined text-sm"
                      style={activeTab === tab.key ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── OPD Tab ── */}
        {activeTab === 'opd' && (
          <>
            <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
              <div className="space-y-4 py-2 md:py-4 pb-12 flex flex-col min-h-[calc(100vh-120px)]">

                {/* Table Container Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[500px] overflow-hidden">
                  <Table
                      columns={columns}
                      data={displayAppointments}
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
          </>
        )}

        {/* ── IPD Tab ── */}
        {activeTab === 'ipd' && (
          <>
          <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
            <PageHeader
              title="IPD Admissions"
              headerActions={
                isAdmin && (
                  <Link href="/settings/wards">
                    <Button variant="secondary" icon="settings">Ward Config</Button>
                  </Link>
                )
              }
            />

            <div className="mt-4 mb-4 w-64">
              <SearchInput
                placeholder="Search admissions..."
                value={ipdSearchTerm}
                onChange={(e) => setIpdSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <Table
                data={admissions?.content || []}
                columns={ipdColumns}
                isLoading={ipdLoading}
                onRowDoubleClick={(row) => router.push(`/ipd/admissions/${row.id}`)}
              />
              {admissions && admissions.totalElements > 0 && (
                <Pagination
                  page={admissions.page}
                  totalElements={admissions.totalElements}
                  pageSize={admissions.size}
                  onPageChange={(page) => fetchAdmissions(page)}
                  label="admissions"
                />
              )}
            </div>

            <AdmitPatientModal
              isOpen={isAdmitModalOpen}
              onClose={() => setIsAdmitModalOpen(false)}
              onSuccess={() => {
                setIsAdmitModalOpen(false);
                fetchAdmissions();
              }}
            />
          </PageSurface>

          {/* IPD Floating Action Capsule */}
          <div className="fixed bottom-6 right-6 flex flex-row items-center gap-3 z-[100] bg-gradient-to-b from-slate-900 to-black border border-slate-800 p-2.5 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300">

            {/* New Patient Button */}
            <Link
              href="/reception/patients/create"
              className={cn(
                "animate-shine-laser flex items-center justify-center h-12 p-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all duration-300 ease-out overflow-hidden active:scale-95 no-underline decoration-transparent select-none border-none shadow-[0_4px_12px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:brightness-110",
                isIpdAdmissionHovered ? "w-12" : "w-44"
              )}
            >
              <div className="flex items-center justify-center gap-2.5 min-w-max">
                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                  <span className="material-symbols-outlined text-xl font-bold">person_add</span>
                </div>
                <span className={cn(
                  "font-bold text-xs whitespace-nowrap uppercase tracking-wider transition-all duration-300 ease-out no-underline decoration-transparent",
                  isIpdAdmissionHovered ? "opacity-0 max-w-0" : "opacity-100 max-w-[120px]"
                )}>
                  New Patient
                </span>
              </div>
            </Link>

            {/* New Admission Button */}
            <Link
              href="/ipd/admissions/new"
              onMouseEnter={() => setIsIpdAdmissionHovered(true)}
              onMouseLeave={() => setIsIpdAdmissionHovered(false)}
              className="animate-shine-laser group flex items-center justify-center h-12 w-12 hover:w-44 p-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white transition-all duration-300 ease-out overflow-hidden active:scale-95 no-underline decoration-transparent select-none border-none shadow-[0_4px_12px_rgba(234,88,12,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] hover:brightness-110"
            >
              <div className="flex items-center justify-center gap-2.5 min-w-max">
                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                  <span className="material-symbols-outlined text-xl font-bold">add</span>
                </div>
                <span className="font-bold text-xs whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[120px] transition-all duration-300 ease-out uppercase tracking-wider no-underline decoration-transparent">
                  New Admission
                </span>
              </div>
            </Link>
          </div>
          </>
        )}

      </MainLayout>
  );
};
