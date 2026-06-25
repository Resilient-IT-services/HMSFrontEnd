'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { formatDateTime } from '@/utils/formatters';
import dayjs from '@/lib/dayjs';
import { PageSurface } from '@/components/ui/PageSurface';
import { IpdAdmissionsContent, IpdStatusFilter } from '@/modules/ipd/components/IpdAdmissionsContent';
import { useIpd } from '@/modules/ipd/hooks/useIpd';


/**
 * 3D Glassmorphic Date Range Filter (Compact Header Version)
 */
const DateRangeFilter = ({
                           onFilter,
                           activeFilters
                         }: {
  onFilter: (key: string, value: string) => void,
  activeFilters: Record<string, string>
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasFilter = !!(activeFilters.from || activeFilters.to);

  // Auto-close dropdown 300ms after both dates are selected
  useEffect(() => {
    if (activeFilters.from && activeFilters.to) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeFilters.from, activeFilters.to]);

  return (
      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
        <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className="px-3 py-2 border border-orange-200 bg-orange-100 hover:bg-orange-200 cursor-pointer rounded-none"
            title="Date Range Filter"
        >
          <span className="material-symbols-outlined text-[15px] font-bold">calendar_month</span>
        </button>

        {isOpen && (
            <>
              <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
              <div
                  className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[120] min-w-[260px] flex flex-col gap-4 normal-case tracking-normal animate-in fade-in slide-in-from-top-2 duration-150 text-slate-700"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600 text-sm">calendar_month</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Filter Date Range</span>
                  </div>
                  {hasFilter && (
                      <button
                          onClick={() => { onFilter('from', ''); onFilter('to', ''); setIsOpen(false); }}
                          className="text-[10px] font-bold text-orange-600 hover:underline cursor-pointer"
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
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 cursor-not-allowed"
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
  const [ipdStatusFilter, setIpdStatusFilter] = useState<IpdStatusFilter>('ALL');




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

  const handleFilterChange = useCallback((key: string, value: string) => {
    if (statusFilter === 'UPCOMING' && key === 'from') return;
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  }, [statusFilter, setColumnFilters]);

  useEffect(() => {
    if (statusFilter === 'UPCOMING') {
      const today = dayjs().startOf('day').toISOString();

      setColumnFilters(prev => ({
        ...prev,
        from: today
      }));
    } else {
      setColumnFilters(prev => ({
        ...prev,
        from: '',
        to: ''
      }));
    }
  }, [statusFilter, setColumnFilters]);

  // Reload data on mount to ensure freshness
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hospitalTimezone = useSelector((state: RootState) => state.auth.hospitalTimezone);

  const filteredAppointments = useMemo(() => {
    return rawAppointments.filter(app => {
      const appDate = dayjs(app.appointmentTime);

      return (
        (!columnFilters.from || !appDate.isBefore(dayjs(columnFilters.from))) &&
        (!columnFilters.to || !appDate.isAfter(dayjs(columnFilters.to)))
      );
    });
  }, [rawAppointments, columnFilters]);

  const { totalTodayAppointments, completedAppointments, upcomingAppointments } = useMemo(() => {
    const now = hospitalTimezone ? dayjs().tz(hospitalTimezone) : dayjs();
    const todayStart = now.startOf('day').valueOf();
    const todayEnd = now.endOf('day').valueOf();
    const tomorrowStart = now.add(1, 'day').startOf('day').valueOf();
    const futureEnd = now.add(30, 'days').endOf('day').valueOf();

    const upcomingAllowedStatuses = new Set(['SCHEDULED', 'PAYMENT_PENDING', 'PAID', 'VITALS_RECORDED']);

    const today = filteredAppointments.filter(app => {
      const appDate = dayjs(app.appointmentTime).valueOf();
      return appDate >= todayStart && appDate <= todayEnd;
    });

    const completed = today.filter(app => app.status === 'COMPLETED');

    const upcoming = filteredAppointments.filter(app => {
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
  }, [filteredAppointments, hospitalTimezone]);

  const displayAppointments = useMemo(() => {
    if (statusFilter === 'UPCOMING') return upcomingAppointments;
    if (statusFilter === 'COMPLETED') return completedAppointments;
    return totalTodayAppointments;
  }, [statusFilter, totalTodayAppointments, completedAppointments, upcomingAppointments]);

  const columns: Column<AppointmentSummaryDTO>[] = useMemo(() => [
    {
      header: 'Token',
      headerClassName: 'text-center font-bold text-slate-700',
      className: 'text-center',
      mobilePosition: 'meta',
      sortable: true,
      sortKey: 'tokenNumber',
      render: (app) => <span className="font-bold text-slate-900">{formatToken(app)}</span>
    },
    {
      header: 'VISIT DATE & TIME',
      headerClassName: 'text-center font-bold text-slate-700',
      className: 'text-center',
      mobilePosition: 'title',
      sortable: true,
      sortKey: 'appointmentTime',
      renderHeader: () => (
          <div className="flex items-center justify-center gap-1.5 justify-center">
            <span>VISIT DATE & TIME</span>
            {statusFilter === 'UPCOMING' && (
              <div className="flex items-center justify-center gap-2">
                <DateRangeFilter onFilter={handleFilterChange} activeFilters={columnFilters} />
              </div>
            )}
          </div>
      ),
      render: (app) => (
        <div className="flex items-center justify-center w-full text-center">
          <span className="font-medium text-slate-900">
            {formatDateTime(app.appointmentTime)}
          </span>
        </div>
      )
    },
    {
      header: 'Patient',
      headerClassName: 'text-center font-bold text-slate-700',
      className: 'text-center',
      mobilePosition: 'subtitle',
      sortable: true,
      sortKey: 'patientName',
      render: (app) => (
        <div className="flex flex-col items-center justify-center text-center">
          <p className="font-bold text-slate-900">{app.patientName}</p>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">
            Code: {(app as any).patientCode || 'N/A'}
          </p>
        </div>
      )
    },
    {
      header: 'Doctor',
      headerClassName: 'text-center font-bold text-slate-700',
      className: 'text-center',
      mobilePosition: 'body',
      sortable: true,
      sortKey: 'doctorName',
      render: (app) => (
        <div className="flex flex-col items-center justify-center text-center">
          <p className="font-medium text-slate-700">{app.doctorName}</p>
          <p className="text-xs text-slate-500 uppercase font-bold">
            {app.doctorSpecialization}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      headerClassName: 'text-center font-bold text-slate-700',
      className: 'text-center',
      mobilePosition: 'meta',
      sortable: true,
      sortKey: 'status',
      render: (app) => {
        const variants: Record<string, any> = {
          SCHEDULED: 'orange', PAYMENT_PENDING: 'orange', PAID: 'orange',
          VITALS_RECORDED: 'purple', CONSULTATION_STARTED: 'blue',
          PRESCRIPTION_FINALIZED: 'blue', COMPLETED: 'emerald', CANCELLED: 'red'
        };

        const isVitalsNotRecorded = ['SCHEDULED', 'PAYMENT_PENDING', 'PAID'].includes(app.status);
        const badgeText = isVitalsNotRecorded ? 'Vitals Not Recorded' : app.status.replace('_', ' ');

        return (
          <div className="flex justify-center items-center w-full">
            <div className="shadow-sm inline-block text-center">
              <Badge variant={variants[app.status] || 'slate'}>{badgeText}</Badge>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Actions',
      headerClassName: 'text-center font-bold text-slate-700',
      className: 'text-center',
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
            <div className="flex items-center justify-center gap-2 w-full">
              {shouldShowVitalsButton && (
                  <button
                      onClick={() => router.push(`/reception/appointments/vitals?appointmentId=${app.id}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 h-9 rounded-full bg-orange-600 text-white shadow-md hover:bg-orange-700 shadow-[0_3px_8px_rgba(234,88,12,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all active:scale-95 text-xs font-black uppercase tracking-wider select-none border-none outline-none cursor-pointer"
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
  ], [router, columnFilters, statusFilter, handleFilterChange]);

  const statConfig = [
    { label: 'Total Today', value: totalTodayAppointments.length, filter: 'ALL', icon: 'analytics', colorClass: 'from-slate-700 to-slate-800 border-slate-900 shadow-slate-900/5' },
    { label: 'Completed', value: completedAppointments.length, filter: 'COMPLETED', icon: 'check_circle', colorClass: 'from-emerald-600 to-emerald-700 border-emerald-800 shadow-emerald-600/5' },
    { label: 'Upcoming', value: upcomingAppointments.length, filter: 'UPCOMING', icon: 'analytics', colorClass: 'from-indigo-600 to-indigo-700 border-indigo-800 shadow-indigo-600/5' },
  ];

  // ── IPD stat cards ─────────────────────────────────────────────────────────
  const { admissions: ipdAdmissions, fetchAdmissions: fetchIpdStats } = useIpd();

  useEffect(() => {
    if (activeTab === 'ipd') fetchIpdStats(0, 200);
  }, [activeTab, fetchIpdStats]);

  const ipdStatConfig = useMemo(() => {
    const list = ipdAdmissions?.content || [];
    const todayStart = dayjs().startOf('day');
    const todayAdmitted = list.filter(a => dayjs(a.admissionDateTime).isAfter(todayStart)).length;
    const admitted    = list.filter(a => a.status === 'ADMITTED').length;
    const discharged  = list.filter(a => a.status === 'DISCHARGED').length;
    return [
      { label: "Today's Admitted", value: todayAdmitted, filter: 'TODAY'      as IpdStatusFilter, icon: 'hotel',        colorClass: 'from-slate-700 to-slate-800 border-slate-900 shadow-slate-900/5' },
      { label: 'Admitted',         value: admitted,      filter: 'ADMITTED'   as IpdStatusFilter, icon: 'bed',          colorClass: 'from-orange-600 to-orange-700 border-orange-800 shadow-orange-600/5' },
      { label: 'Discharged',       value: discharged,    filter: 'DISCHARGED' as IpdStatusFilter, icon: 'check_circle', colorClass: 'from-emerald-600 to-emerald-700 border-emerald-800 shadow-emerald-600/5' },
    ];
  }, [ipdAdmissions]);
  // ── end IPD stat cards ─────────────────────────────────────────────────────

  const handleTabClick = (filterType: string) => {
    setStatusFilter(filterType as any);
    if (activeFilters.statuses?.length) {
      resetFilters();
    }
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

            {/* ── Dashboard header (always visible) ── */}
            <div className="flex flex-col gap-1">

              {/* ROW 1: title (left) + stat cards (right) */}
              <div className="flex items-center justify-between">
                <h1 className="font-manrope text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none shrink-0">
                  Today's Appointments
                </h1>
                <div className="flex items-center gap-2 ml-auto overflow-x-auto no-scrollbar pl-4">
                  {activeTab === 'opd'
                    ? statConfig.map((stat, i) => {
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
                      })
                    : ipdStatConfig.map((stat, i) => {
                        const isActive = ipdStatusFilter === stat.filter;
                        return (
                          <button
                            key={i}
                            onClick={() => setIpdStatusFilter(isActive ? 'ALL' : stat.filter)}
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
                      })
                  }
                </div>
              </div>

              {/* ROW 2: subtitle */}
              <div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">
                  Real-time patient visit status
                </p>
              </div>

              {/* ROW 3: OPD / IPD tab switcher */}
              <div className="flex items-center w-fit bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm mt-1">
                {(['opd', 'ipd'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); if (tab === 'opd') setIpdStatusFilter('ALL'); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-md font-black text-[10px] uppercase tracking-wider transition-all duration-200 active:scale-95",
                      activeTab === tab
                        ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-md shadow-orange-600/20 border border-orange-700"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <span className="material-symbols-outlined text-sm leading-none">
                      {tab === 'opd' ? 'stethoscope' : 'hotel'}
                    </span>
                    {tab === 'opd' ? 'OPD' : 'IPD'}
                  </button>
                ))}
              </div>

            </div>
            {/* ── end header ── */}

            {/* OPD table */}
            {activeTab === 'opd' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-auto overflow-visible">
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
            )}

            {/* IPD content */}
            {activeTab === 'ipd' && <IpdAdmissionsContent statusFilter={ipdStatusFilter} />}

          </div>
        </PageSurface>

        {/* NEXT LEVEL SHINING LASER CONTROL FLOATER CAPSULE */}
        {activeTab === 'opd' && (
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
        )}

        {/* IPD FLOATER CAPSULE */}
        {activeTab === 'ipd' && (
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
        )}

      </MainLayout>

  );
};