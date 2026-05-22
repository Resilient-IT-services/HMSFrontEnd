'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { nurseService } from '@/services/nurseService';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentResponse, PatientSummaryDTO, DoctorStaffResponse } from '@/types/api';
import { PageHeading } from '@/components/ui/PageHeading';
import { MetricCard } from '@/components/ui/MetricCard';
import { MetricsGrid } from '@/components/ui/MetricsGrid';
import { PageSurface } from '@/components/ui/PageSurface';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { DASHBOARD_REFRESH_INTERVAL } from '@/utils/constants';
import { cn } from '@/lib/cn';
import { getPrimaryDepartment } from '@/utils/staffDisplay';
import { getHospitalDayRangeUTC } from '@/utils/dateValidator';
import dayjs from '@/lib/dayjs';

export const ReceptionDashboard = () => {
  const router = useRouter();
  const { hospitalTimezone } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentPatients, setRecentPatients] = useState<PatientSummaryDTO[]>([]);
  const [totalNurses, setTotalNurses] = useState(0);

  const [stats, setStats] = useState({
    appointmentsToday: 0,
    activeQueue: 0,
    totalPatients: 0
  });

  const fetchData = useCallback(async (isBackground = false) => {
    if (!hospitalTimezone) return;
    
    if (!isBackground) setLoading(true);
    try {
      const { from, to } = getHospitalDayRangeUTC(hospitalTimezone);
      const [appRes, docRes, patRes, statsRes, nurseRes] = await Promise.all([
        appointmentService.list({ 
          page: 0, 
          size: 5, 
          from, 
          to 
        }),
        doctorService.list(0, 4),
        patientService.listSummary(0, 5),
        appointmentService.getStats(from, to),
        nurseService.list(0, 1)
      ]);

      if (appRes.success && appRes.data) {
        setAppointments(appRes.data.content);
      }
      if (docRes.success && docRes.data) setDoctors(docRes.data.content);
      if (patRes.success && patRes.data) setRecentPatients(patRes.data.content);
      if (nurseRes.success && nurseRes.data) setTotalNurses(nurseRes.data.totalElements);
      
      if (statsRes.success && statsRes.data) {
        setStats({
          appointmentsToday: statsRes.data.total,
          activeQueue: statsRes.data.upcoming + (statsRes.data.byStatus['SCHEDULED'] || 0) + (statsRes.data.byStatus['VITALS_RECORDED'] || 0),
          totalPatients: patRes.data?.totalElements || 0
        });
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [hospitalTimezone]);

  useEffect(() => {
    const trigger = async () => {
      await fetchData();
    };
    void trigger();
  }, [fetchData]);

  useAutoRefresh(fetchData, DASHBOARD_REFRESH_INTERVAL);

  const getLocalDateKey = useCallback((date: Date) => {
    if (!hospitalTimezone) return date.toISOString().split('T')[0];
    return dayjs(date).tz(hospitalTimezone).format('YYYY-MM-DD');
  }, [hospitalTimezone]);

  const [showFabMenu, setShowFabMenu] = useState(false);

  const patientColumns: Column<PatientSummaryDTO>[] = [
    {
      header: 'Full Name',
      mobilePosition: 'title',
      render: (p) => <span className="font-bold text-slate-900">{p.fullName}</span>
    },
    {
      header: 'Code',
      mobilePosition: 'subtitle',
      render: (p) => <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{p.patientCode}</span>
    },
    {
      header: 'Contact',
      key: 'phone',
      mobilePosition: 'body'
    }
  ];

  const metricItems = [
    {
      label: 'Active Queue',
      value: stats.activeQueue,
      variant: 'blue' as const,
      icon: 'hourglass_empty',
      layout: 'horizontal' as const,
      tag: 'Today',
      onClick: () => router.push('/reception/appointments')
    },
    {
      label: 'Appointments Today',
      value: stats.appointmentsToday,
      variant: 'purple' as const,
      icon: 'event_available',
      layout: 'horizontal' as const,
      tag: 'Today',
      onClick: () => router.push('/reception/appointments')
    },
    {
      label: 'Nurses On Duty',
      value: totalNurses,
      variant: 'emerald' as const,
      icon: 'payments',
      layout: 'horizontal' as const,
      tag: 'Live'
    }
  ];

  const appointmentColumns: Column<AppointmentResponse>[] = [
    {
      header: 'Patient',
      mobilePosition: 'title',
      render: (a) => <span className="font-bold text-slate-900">{a.patientName}</span>
    },
    {
      header: 'Doctor',
      mobilePosition: 'subtitle',
      render: (a) => <span className="text-slate-600 font-medium">{a.doctorName}</span>
    },
    {
      header: 'Status',
      mobilePosition: 'meta',
      render: (a) => {
        const variants: Record<string, any> = {
          SCHEDULED: 'blue',
          PAYMENT_PENDING: 'orange',
          PAID: 'emerald',
          VITALS_RECORDED: 'purple',
          COMPLETED: 'emerald',
          CANCELLED: 'red'
        };
        return <Badge variant={variants[a.status] || 'slate'}>{a.status.replace('_', ' ')}</Badge>;
      }
    }
  ];

  return (
    <MainLayout title="Reception Dashboard" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          {/* Info Pills Row - Visible only on mobile */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide md:hidden">
            <MetricCard 
              label="Queue Load" 
              value={stats.activeQueue} 
              icon="timer" 
              variant="orange" 
              layout="pill" 
              onClick={() => router.push('/reception/appointments')}
            />
            <MetricCard 
              label="Check-ins" 
              value={stats.appointmentsToday} 
              icon="login" 
              variant="blue" 
              layout="pill" 
              onClick={() => router.push('/reception/appointments')}
            />
            <MetricCard 
              label="Doctors" 
              value={doctors.length} 
              icon="stethoscope" 
              variant="emerald" 
              layout="pill" 
              onClick={() => router.push('/reception/doctors')}
            />
            <MetricCard 
              label="Support" 
              value="Online" 
              icon="support_agent" 
              variant="purple" 
              layout="pill" 
            />
          </div>

          {/* Mobile Header - Visible only on small screens */}
          <div className="md:hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-700 shrink-0">
                  <span className="material-symbols-outlined">desk</span>
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-900 leading-tight">Reception</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Arrivals & Queue</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2 opacity-40 group/date cursor-default hidden md:flex">
            <span className="material-symbols-outlined text-xs group-hover/date:text-orange-600 transition-colors">calendar_today</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">
              {hospitalTimezone ? dayjs().tz(hospitalTimezone).format('MMM DD, YYYY') : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <PageHeading
            title="Reception Dashboard"
            description="Manage arrivals, patient queues, and daily operations."
            className="hidden md:flex"
          />

          {/* Mobile Stats Cards */}
          <div className="md:hidden space-y-4 mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Arrivals</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="bg-slate-900 p-4 rounded-2xl text-white shadow-lg flex flex-col justify-between h-32 cursor-pointer active:scale-95 transition-all"
                onClick={() => router.push('/reception/appointments')}
              >
                <span className="material-symbols-outlined text-white/50 text-xl">hourglass_empty</span>
                <div>
                  <p className="text-[32px] font-extrabold leading-none mb-1">{stats.activeQueue}</p>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Active Queue</p>
                </div>
              </div>
              <div 
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 cursor-pointer active:scale-95 transition-all"
                onClick={() => router.push('/reception/patients')}
              >
                <span className="material-symbols-outlined text-orange-500 text-xl">group</span>
                <div>
                  <p className="text-[32px] font-extrabold text-slate-900 leading-none mb-1">{stats.totalPatients}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patients</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid - Hidden on Mobile */}
          <MetricsGrid items={metricItems} className="mb-8 hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6" />

          {/* Main Section Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Recent Appointments Table */}
              <Card 
                title="Recent Appointments" 
                className="p-0 overflow-hidden"
                headerActions={
                  <Button variant="ghost" size="sm" onClick={() => router.push('/reception/appointments')} className="text-orange-600 font-bold">View All</Button>
                }
              >
                <Table 
                  columns={appointmentColumns} 
                  data={appointments.slice(0, 5)} 
                  isLoading={loading}
                  onRowDoubleClick={(a) => router.push(`/reception/billing?appointmentId=${a.id}`)}
                />
              </Card>

              {/* Recent Patients Table */}
              <Card 
                title="Recent Patient Arrivals" 
                className="p-0 overflow-hidden"
                headerActions={
                  <Button variant="ghost" size="sm" onClick={() => router.push('/reception/patients')} className="text-orange-600 font-bold">View All</Button>
                }
              >
                <Table 
                  columns={patientColumns} 
                  data={recentPatients} 
                  isLoading={loading}
                  onRowDoubleClick={(p) => router.push(`/reception/patients/${p.id}`)}
                />
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-8">
              {/* Quick Actions */}
              <Card title="Clinical Resources" className="p-4 bg-white text-black border border-gray-200 shadow-md">
                <div className="space-y-3">

                  {/* Register Patient */}
                  <div
                      className="p-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer group"
                      onClick={() => router.push('/reception/patients/register')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">person_add</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-black">Register Patient</h4>
                        <p className="text-[10px] text-gray-500 font-medium">New EHR Initialization</p>
                      </div>
                    </div>
                  </div>

                  {/* Create OP Visit */}
                  <div
                      className="p-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer group"
                      onClick={() => router.push('/reception/appointments/create')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">calendar_add_on</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-black">Create OP Visit</h4>
                        <p className="text-[10px] text-gray-500 font-medium">Consultation Booking</p>
                      </div>
                    </div>
                  </div>

                </div>
              </Card>

              <Card title="Available Doctors" className="p-0 overflow-hidden">
                 <div className="divide-y divide-slate-50">
                    {doctors.slice(0, 4).map((doc, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                         <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs">
                               {doc.fullName.charAt(0)}
                            </div>
                            <div>
                               <h5 className="text-xs font-bold text-slate-900">{doc.fullName}</h5>
                               <p className="text-[9px] font-black uppercase text-slate-400">{getPrimaryDepartment(doc)}</p>
                            </div>
                         </div>
                         <Badge variant="emerald" className="text-[8px] px-1.5 py-0.5">ON DUTY</Badge>
                      </div>
                    ))}
                 </div>
                 <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <Button variant="ghost" fullWidth size="sm" onClick={() => router.push('/reception/doctors')} className="text-[10px] font-black uppercase">View Roster</Button>
                 </div>
              </Card>
            </div>
          </div>
        </div>
      </PageSurface>

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-24 right-6 z-50">
        {showFabMenu && (
          <div className="absolute bottom-16 right-0 space-y-3 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <button 
              onClick={() => router.push('/reception/appointments/create')}
              className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 whitespace-nowrap"
            >
              <span className="text-xs font-black text-slate-900 uppercase">Book Visit</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm">calendar_add_on</span>
              </div>
            </button>
            <button 
              onClick={() => router.push('/reception/patients/register')}
              className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 whitespace-nowrap"
            >
              <span className="text-xs font-black text-slate-900 uppercase">Register</span>
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm">person_add</span>
              </div>
            </button>
          </div>
        )}
        <button 
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={cn(
            "w-14 h-14 bg-slate-900 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300",
            showFabMenu ? "rotate-45 bg-red-600" : ""
          )}
        >
          <span className="material-symbols-outlined text-2xl font-bold">add</span>
        </button>
      </div>
    </MainLayout>
  );
};
