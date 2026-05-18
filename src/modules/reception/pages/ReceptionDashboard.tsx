'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { nurseService } from '@/services/nurseService';
import { PatientResponse, AppointmentResponse, DoctorStaffResponse, NurseStaffResponse } from '@/types/api';
import { normalizeAppointmentData, syncExpiredAppointments } from '@/utils/appointmentHelper';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { MetricsGrid } from '@/components/ui/MetricsGrid';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { DASHBOARD_REFRESH_INTERVAL } from '@/utils/constants';
import { cn } from '@/lib/cn';
import { getPrimaryDepartment } from '@/utils/staffDisplay';

const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPatientCreatedDateKey = (createdAt?: string) => {
  if (!createdAt) return '';

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return createdAt.slice(0, 10);
  }

  return getLocalDateKey(parsedDate);
};

export const ReceptionDashboard = () => {
  const router = useRouter();
  const [recentPatients, setRecentPatients] = useState<PatientResponse[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [totalAppointmentsToday, setTotalAppointmentsToday] = useState(0);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [nurses, setNurses] = useState<NurseStaffResponse[]>([]);
  const [totalNurses, setTotalNurses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFabMenu, setShowFabMenu] = useState(false);

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const today = getLocalDateKey(new Date());
      
      const [patRes, appRes, docRes, nurRes] = await Promise.all([
        patientService.list(0, 500),
        appointmentService.list(0, 500, undefined, today),
        doctorService.list(0, 10),
        nurseService.list(0, 10)
      ]);

      if (patRes.success && patRes.data) {
        const patients = patRes.data.content || [];
        setRecentPatients(patients.slice(0, 5));
        setTotalPatients(patRes.data.totalElements);
      }
      if (appRes.success && appRes.data) {
        const normalized = normalizeAppointmentData(appRes.data.content || []);
        setAppointments(normalized);
        setTotalAppointmentsToday(appRes.data.totalElements);
        syncExpiredAppointments(appRes.data.content || []);
      }
      if (docRes.success && docRes.data) setDoctors(docRes.data.content || []);
      if (nurRes.success && nurRes.data) {
        setNurses(nurRes.data.content || []);
        setTotalNurses(nurRes.data.totalElements);
      }

    } catch (error) {
      console.error('Operation fetchData in ReceptionDashboard failed:', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const trigger = async () => {
      await fetchData();
    };
    void trigger();
  }, [fetchData]);

  useAutoRefresh(fetchData, DASHBOARD_REFRESH_INTERVAL);

  const stats = useMemo(() => {
    const activeQueue = appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length;
    const doctorQueueByName = new Map<string, number>();

    for (const appointment of appointments) {
      if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
        continue;
      }

      const currentCount = doctorQueueByName.get(appointment.doctorName) || 0;
      doctorQueueByName.set(appointment.doctorName, currentCount + 1);
    }

    return {
      totalPatients,
      activeQueue,
      appointmentsToday: totalAppointmentsToday,
      doctorQueueByName
    };
  }, [totalPatients, appointments, totalAppointmentsToday]);

  const patientColumns: Column<PatientResponse>[] = [
    {
      header: 'Patient Name',
      mobilePosition: 'title',
      render: (p) => <span className="font-bold text-slate-900">{p.fullName}</span>
    },
    {
      header: 'Phone',
      mobilePosition: 'subtitle',
      key: 'phone'
    },
    {
      header: 'Status',
      mobilePosition: 'meta',
      render: () => <Badge variant="orange">Registered</Badge>
    }
  ];

  const metricItems = [
    {
      label: 'Total Patients',
      value: stats.totalPatients,
      variant: 'orange' as const,
      icon: 'group',
      layout: 'horizontal' as const,
      tag: 'All Time'
    },
    {
      label: 'Active Queue',
      value: stats.activeQueue,
      variant: 'blue' as const,
      icon: 'hourglass_empty',
      layout: 'horizontal' as const,
      tag: 'Today'
    },
    {
      label: 'Appointments Today',
      value: stats.appointmentsToday,
      variant: 'purple' as const,
      icon: 'event_available',
      layout: 'horizontal' as const,
      tag: 'Today'
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

  return (
    <MainLayout title="Reception Dashboard" hideTitle>
      <PageSurface fontClassName="font-manrope">
        {/* Info Pills Row - Visible only on mobile */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide md:hidden">
          <MetricCard 
            label="Queue Load" 
            value={stats.activeQueue} 
            icon="timer" 
            variant="orange" 
            layout="pill" 
          />
          <MetricCard 
            label="Check-ins" 
            value={stats.appointmentsToday} 
            icon="login" 
            variant="blue" 
            layout="pill" 
          />
          <MetricCard 
            label="Doctors" 
            value={doctors.length} 
            icon="stethoscope" 
            variant="emerald" 
            layout="pill" 
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
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
            <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-lg flex flex-col justify-between h-32">
              <span className="material-symbols-outlined text-white/50 text-xl">hourglass_empty</span>
              <div>
                <p className="text-[32px] font-extrabold leading-none mb-1">{stats.activeQueue}</p>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Active Queue</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
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

            {/* Doctor Availability Grid */}
            <section className="space-y-4">
              <h4 className="font-bold text-slate-900 px-1 uppercase text-[10px] tracking-widest text-slate-400">Doctor Availability Snapshot</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {doctors.map((doc) => (
                  <Card key={doc.assignmentId} className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl shrink-0">
                      {doc.fullName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{doc.fullName}</p>
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-tighter">{stats.doctorQueueByName.get(doc.fullName) || 0} queued today</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900 leading-none">{stats.doctorQueueByName.get(doc.fullName) || 0}</p>
                      <p className="text-[10px] uppercase text-slate-400 font-black mt-1">Queue</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-8">
            {/* Quick Actions */}
            <Card className="bg-slate-900 text-white shadow-xl border-none hidden lg:block">
              <h4 className="font-bold mb-6 uppercase text-[10px] tracking-widest opacity-50">Quick Actions</h4>
              <div className="space-y-4">
                <Button                  fullWidth
                  onClick={() => router.push('/reception/patients/create')}
                  icon="person_add"
                  className="justify-between"
                >
                  Register Patient
                  <span className="material-symbols-outlined">chevron_right</span>
                </Button>
                <Button 
                  fullWidth
                  variant="secondary"
                  onClick={() => router.push('/reception/appointments/create')}
                  icon="medical_services"
                  className="bg-slate-800 border-slate-700  justify-between"
                >
                  Create Visit
                  <span className="material-symbols-outlined">chevron_right</span>
                </Button>
              </div>
            </Card>

            {/* Staff on Duty */}
            <Card title="Nursing Staff on Duty" subtitle="CURRENT SHIFT">
              <div className="space-y-4">
                {loading && <p className="text-[10px] text-slate-400 italic">Loading staff list...</p>}
                {nurses.map((n) => (
                  <div key={n.assignmentId} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">{n.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{getPrimaryDepartment(n)}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                ))}
                {nurses.length === 0 && <p className="text-[10px] text-slate-400 italic">No nurses listed.</p>}
              </div>
            </Card>
          </div>
        </div>
      </PageSurface>

      {/* Mobile Floating Action Button */}
      {showFabMenu && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowFabMenu(false)}
        />
      )}
      
      <div className="lg:hidden fixed bottom-8 right-6 z-50 flex flex-col items-end gap-3">
        {showFabMenu && (
          <div className="flex flex-col items-end gap-3 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <button
              onClick={() => {
                setShowFabMenu(false);
                router.push('/reception/appointments/create');
              }}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 active:scale-95 transition-all"
            >
              <span className="text-sm font-bold text-slate-900">Create Visit</span>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                <span className="material-symbols-outlined text-xl">medical_services</span>
              </div>
            </button>
            <button
              onClick={() => {
                setShowFabMenu(false);
                router.push('/reception/patients/create');
              }}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 active:scale-95 transition-all"
            >
              <span className="text-sm font-bold text-slate-900">Register Patient</span>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                <span className="material-symbols-outlined text-xl">person_add</span>
              </div>
            </button>
          </div>
        )}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={cn(
            "w-14 h-14 rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center transition-all active:scale-90 duration-300",
            showFabMenu ? "rotate-45 bg-red-600" : ""
          )}
        >
          <span className="material-symbols-outlined text-2xl font-bold">add</span>
        </button>
      </div>
    </MainLayout>
  );
};
