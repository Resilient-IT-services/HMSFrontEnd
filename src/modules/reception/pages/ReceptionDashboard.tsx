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
import { MetricsGrid } from '@/components/ui/MetricsGrid';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { DASHBOARD_REFRESH_INTERVAL } from '@/utils/constants';

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
  const [patientsRegisteredToday, setPatientsRegisteredToday] = useState(0);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [nurses, setNurses] = useState<NurseStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const today = getLocalDateKey(new Date());
      
      const [patRes, appRes, docRes, nurRes] = await Promise.all([
        patientService.list(0, 500),
        appointmentService.list(0, 100),
        doctorService.list(0, 6),
        nurseService.list(0, 5)
      ]);

      if (patRes.success && patRes.data) {
        const patients = patRes.data.content || [];
        const todaysPatients = patients.filter((patient) => getPatientCreatedDateKey(patient.createdAt) === today);
        setRecentPatients(patients.slice(0, 5));
        setPatientsRegisteredToday(todaysPatients.length);
      }
      if (appRes.success && appRes.data) {
        const normalized = normalizeAppointmentData(appRes.data.content || []);
        const todayApps = normalized.filter(a => a.appointmentTime.startsWith(today)) || [];
        setAppointments(todayApps);
        syncExpiredAppointments(appRes.data.content || []);
      }
      if (docRes.success && docRes.data) setDoctors(docRes.data.content || []);
      if (nurRes.success && nurRes.data) setNurses(nurRes.data.content || []);

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
      totalPatients: patientsRegisteredToday,
      activeQueue,
      appointmentsToday: appointments.length,
      doctorQueueByName
    };
  }, [patientsRegisteredToday, appointments]);

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
      label: 'Total Patients Today',
      value: stats.totalPatients,
      variant: 'orange' as const,
      icon: 'group',
      layout: 'horizontal' as const,
      tag: 'Live'
    },
    {
      label: 'Active Queue',
      value: stats.activeQueue,
      variant: 'blue' as const,
      icon: 'hourglass_empty',
      layout: 'horizontal' as const,
      tag: 'Live'
    },
    {
      label: 'Appointments Today',
      value: stats.appointmentsToday,
      variant: 'purple' as const,
      icon: 'event_available',
      layout: 'horizontal' as const,
      tag: 'Live'
    },
    {
      label: 'Nurses On Duty',
      value: nurses.length,
      variant: 'emerald' as const,
      icon: 'payments',
      layout: 'horizontal' as const,
      tag: 'Live'
    }
  ];

  return (
    <MainLayout title="Reception Dashboard" hideTitle>
      <PageSurface fontClassName="font-manrope">
        <PageHeading
          title="Reception Dashboard"
          description="Manage arrivals, patient queues, and daily operations."
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm">
            <span className="material-symbols-outlined text-orange-600 text-sm">calendar_today</span>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </PageHeading>

        {/* Metrics Grid */}
        <MetricsGrid items={metricItems} className="mb-8" />

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
            <Card className="bg-slate-900 text-white shadow-xl border-none">
              <h4 className="font-bold mb-6 uppercase text-[10px] tracking-widest opacity-50">Quick Actions</h4>
              <div className="space-y-4">
                <Button 
                  fullWidth
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
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{n.departmentName}</p>
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
    </MainLayout>
  );
};
