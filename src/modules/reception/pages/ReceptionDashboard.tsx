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
import { MetricCard } from '@/components/ui/MetricCard';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const ReceptionDashboard = () => {
  const router = useRouter();
  const [recentPatients, setRecentPatients] = useState<PatientResponse[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [nurses, setNurses] = useState<NurseStaffResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const [patRes, appRes, docRes, nurRes] = await Promise.all([
        patientService.list(0, 5),
        appointmentService.list(0, 100),
        doctorService.list(0, 6),
        nurseService.list(0, 5)
      ]);

      if (patRes.success && patRes.data) setRecentPatients(patRes.data.content || []);
      if (appRes.success && appRes.data) {
        const normalized = normalizeAppointmentData(appRes.data.content || []);
        const todayApps = normalized.filter(a => a.appointmentTime.startsWith(today)) || [];
        setAppointments(todayApps);
        syncExpiredAppointments(appRes.data.content || []);
      }
      if (docRes.success && docRes.data) setDoctors(docRes.data.content || []);
      if (nurRes.success && nurRes.data) setNurses(nurRes.data.content || []);

    } catch (error) {
      console.error(error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30_000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

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
      totalPatients: recentPatients.length,
      activeQueue,
      appointmentsToday: appointments.length,
      doctorQueueByName
    };
  }, [recentPatients, appointments]);

  const patientColumns: Column<PatientResponse>[] = [
    {
      header: 'Patient Name',
      render: (p) => <span className="font-bold text-slate-900">{p.fullName}</span>
    },
    {
      header: 'Phone',
      key: 'phone'
    },
    {
      header: 'Status',
      render: () => <Badge variant="orange">Registered</Badge>
    },
    {
      header: 'Actions',
      render: () => (
        <button className="p-1.5 text-slate-400 hover:text-orange-700 transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm">
          <span className="material-symbols-outlined text-xl">more_vert</span>
        </button>
      ),
      className: 'text-center'
    }
  ];

  return (
    <MainLayout title="Reception Dashboard" hideTitle>
      <div className="p-8 max-w-7xl mx-auto w-full -m-8 bg-[#f9f9ff] min-h-screen font-manrope">
        {/* Page Title */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Reception Dashboard</h2>
            <p className="text-slate-500 font-medium">Manage arrivals, patient queues, and daily operations.</p>
          </div>
          <div className="hidden sm:flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm">
              <span className="material-symbols-outlined text-orange-600 text-sm">calendar_today</span>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            label="Total Patients Today" 
            value={stats.totalPatients} 
            variant="orange" 
            icon="group" 
            layout="horizontal" 
            tag="Live"
          />
          <MetricCard 
            label="Active Queue" 
            value={stats.activeQueue} 
            variant="blue" 
            icon="hourglass_empty" 
            layout="horizontal" 
            tag="Live"
          />
          <MetricCard 
            label="Appointments Today" 
            value={stats.appointmentsToday} 
            variant="purple" 
            icon="event_available" 
            layout="horizontal" 
            tag="Live"
          />
          <MetricCard 
            label="Nurses On Duty" 
            value={nurses.length} 
            variant="emerald" 
            icon="payments" 
            layout="horizontal" 
            tag="Live"
          />
        </div>

        {/* Main Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Recent Patients Table */}
            <Card 
              title="Recent Patient Arrivals" 
              className="p-0 overflow-hidden"
              headerActions={
                <button onClick={() => router.push('/reception/patients')} className="text-orange-600 text-xs font-bold hover:underline">View All</button>
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
                  <div key={doc.assignmentId} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl">
                      {doc.fullName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900">{doc.fullName}</p>
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-tighter">{stats.doctorQueueByName.get(doc.fullName) || 0} queued today</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900">{stats.doctorQueueByName.get(doc.fullName) || 0}</p>
                      <p className="text-[10px] uppercase text-slate-400 font-black">Queue</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-8">
            {/* Quick Actions */}
            <section className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
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
                  className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 justify-between"
                >
                  Create Visit
                  <span className="material-symbols-outlined">chevron_right</span>
                </Button>
              </div>
            </section>

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
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => router.push('/reception/appointments/create')}
        className="fixed bottom-10 right-10 bg-orange-600 text-white p-4 rounded-full shadow-2xl hover:bg-orange-700 transition-all active:scale-95 z-50 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </MainLayout>
  );
};
