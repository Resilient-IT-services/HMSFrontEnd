'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { RootState } from '@/state/store';
import { AppointmentResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken, sortByToken } from '@/utils/tokenHelper';
import { normalizeAppointmentData, syncExpiredAppointments } from '@/utils/appointmentHelper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { MetricsGrid } from '@/components/ui/MetricsGrid';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';

import { useAutoRefresh } from '@/hooks/useAutoRefresh';

export const DoctorDashboard = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (!isBackground) setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await appointmentService.list(0, 100, undefined, today, user.id);

      if (!response.success || !response.data) {
        setAppointments([]);
        return;
      }

      const normalized = normalizeAppointmentData(response.data.content);
      setAppointments(normalized);
      syncExpiredAppointments(response.data.content);
    } catch (error) {
      console.error(error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useAutoRefresh(fetchData, 30_000, !!user);

  const consultationFee = useMemo(() => {
    if (!user || !user.currentHospitalId) return 0;
    const membership = user.memberships.find((m) => m.hospitalId === user.currentHospitalId);
    if (!membership || !membership.roleAssignments) return 0;
    const doctorRole = membership.roleAssignments.find((ra) => ra.roleCode === 'DOCTOR' && ra.active);
    return doctorRole?.doctorDetails?.consultationFee || 0;
  }, [user]);

  const stats = useMemo(() => {
    const waiting = appointments.filter((appointment) => appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN' || appointment.status === 'ADD_VITALS').length;
    const active = appointments.filter((appointment) => appointment.status === 'WALK_IN').length;
    const completed = appointments.filter((appointment) => appointment.status === 'COMPLETED').length;
    const earnedCount = appointments.filter((appointment) => appointment.status !== 'CANCELLED' && appointment.status !== 'PAYMENT_PENDING').length;

    return {
      total: appointments.length,
      waiting,
      active,
      completed,
      earnings: earnedCount * consultationFee,
    };
  }, [appointments, consultationFee]);

  const queue = useMemo(() => {
    const base = appointments.filter(
      (appointment) => appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED'
    );
    return sortByToken(base);
  }, [appointments]);

  const activeAppointment = useMemo(
    () => queue.find((appointment) => appointment.status === 'WALK_IN'),
    [queue],
  );

  const statusCaptions: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    PAYMENT_PENDING: 'Payment Pending',
    WAITING_FOR_VITALS: 'Waiting for Vitals',
    WALK_IN: 'In Progress',
    CANCELLED: 'Cancelled',
    ADD_VITALS: 'Add Vitals',
    CHECKED_IN: 'Checked In'
  };

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      const res = await appointmentService.updateStatus(appointmentId, { status: 'WALK_IN' });
      if (res.success) {
        router.push(`/doctor/active-consultation?appointmentId=${appointmentId}`);
      } else {
        triggerGlobalToast('Failed to start consultation', 'error');
      }
    } catch (error) {
      console.error('Failed to start consultation', error);
      triggerGlobalToast('Failed to start consultation', 'error');
    }
  };

  const handleStartNextConsultation = () => {
    const nextAppointment = queue[0];
    if (!nextAppointment) {
      triggerGlobalToast('No patients in the queue', 'info');
      return;
    }

    void handleStartConsultation(nextAppointment.id);
  };

  const columns: Column<AppointmentResponse>[] = [
    {
      header: 'Token',
      render: (appointment) => (
        <div className={`h-12 w-20 shrink-0 rounded-lg bg-slate-100 text-center text-lg font-bold leading-[3rem] text-slate-400 ${appointment.status === 'WALK_IN' ? 'bg-orange-100 text-orange-700' : ''}`}>
          {formatToken(appointment)}
        </div>
      )
    },
    {
      header: 'Patient Details',
      render: (appointment) => (
        <div>
          <h4 className="text-sm font-bold text-slate-900">{appointment.patientName}</h4>
          <p className="text-[10px] font-black uppercase text-slate-500">
            Scheduled: {new Date(appointment.appointmentTime).toLocaleDateString()} {appointment.appointmentTime.split('T')[1].slice(0, 5)} | {appointment.notes || 'Routine Checkup'}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      render: (appointment) => {
        let variant: 'slate' | 'blue' | 'orange' | 'emerald' | 'red' = 'slate';
        if (appointment.status === 'WALK_IN') variant = 'blue';
        else if (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') variant = 'orange';
        else if (appointment.status === 'COMPLETED') variant = 'emerald';
        else if (appointment.status === 'CANCELLED') variant = 'red';

        return <Badge variant={variant}>{statusCaptions[appointment.status] || appointment.status}</Badge>;
      }
    },
    {
      header: '',
      render: () => (
        <Button variant="ghost" size="sm" icon="more_vert" className="text-slate-300 hover:text-orange-600" />
      ),
      className: 'text-right'
    }
  ];

  const metricItems = [
    {
      label: 'Total Patients',
      value: stats.total,
      variant: 'orange' as const,
      trend: '12%',
      icon: 'trending_up',
      layout: 'compact' as const,
      progressBar: 100
    },
    {
      label: 'Waiting',
      value: stats.waiting,
      variant: 'orange' as const,
      icon: 'hourglass_empty',
      layout: 'compact' as const,
      progressBar: (stats.waiting / (stats.total || 1)) * 100
    },
    {
      label: 'In Progress',
      value: stats.active,
      variant: 'blue' as const,
      icon: 'clinical_notes',
      layout: 'compact' as const,
      progressBar: (stats.active / (stats.total || 1)) * 100
    },
    {
      label: 'Completed',
      value: stats.completed,
      variant: 'emerald' as const,
      icon: 'check_circle',
      layout: 'compact' as const,
      progressBar: (stats.completed / (stats.total || 1)) * 100
    },
    {
      label: "Today's Earnings",
      value: (
        <>
          <span>{`₹${stats.earnings}`}</span>
          <span className="sr-only">{`â‚¹${stats.earnings}`}</span>
        </>
      ),
      variant: 'indigo' as const,
      icon: 'payments',
      layout: 'compact' as const,
      progressBar: 100
    }
  ];

  const breakdownItems = [
    { title: 'Scheduled visits', sub: `${stats.waiting} appointments are queued.`, done: false },
    { title: 'Active consultations', sub: `${stats.active} appointments are in progress.`, done: stats.active > 0 },
    { title: 'Completed visits', sub: `${stats.completed} appointments are finished.`, done: stats.completed > 0 }
  ];

  return (
    <MainLayout title="Doctor Dashboard" hideTitle>
      <PageSurface paddingClassName="p-4 lg:p-8">
        <section className="mb-8">
          <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:p-8">
            <div className="relative z-10 w-full lg:w-auto">
              <PageHeading 
                title={`Good morning, Dr. ${user?.fullName.split(' ')[0]}`}
                description={`You have ${stats.total} consultations scheduled for today. ${stats.waiting} patients are currently in the queue.`}
              />
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <Button onClick={handleStartNextConsultation} icon="play_arrow">
                  Start Next Consultation
                </Button>
                <Button variant="secondary" href="/doctor/patient-queue" icon="list_alt">
                  Go to Queue
                </Button>
              </div>
            </div>
            <div className="absolute right-0 top-0 hidden h-full w-1/3 bg-gradient-to-l from-orange-100/50 to-transparent lg:block" />
            <div className="z-10 hidden items-center justify-center pr-8 lg:flex">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <span className="material-symbols-outlined text-6xl">medical_services</span>
              </div>
            </div>
          </div>
        </section>

        <MetricsGrid items={metricItems} className="mb-8 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-6" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <Card title="Upcoming Patient Queue" className="h-full overflow-hidden p-0">
              <Table
                columns={columns}
                data={queue}
                isLoading={loading}
                onRowDoubleClick={(appointment) => handleStartConsultation(appointment.id)}
                emptyMessage="No patients in the queue for today."
              />
            </Card>
          </section>

          <div className="flex flex-col gap-6">
            <Card 
              className="bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/20"
              headerActions={<Badge className="border-transparent bg-white/20 text-white">Current Visit</Badge>}
            >
              <div className="relative z-10">
                <div className="mb-4 flex items-start justify-between">
                  <span className="font-mono text-[10px] font-bold">
                    {activeAppointment ? `${new Date(activeAppointment.appointmentTime).toLocaleDateString()} ${activeAppointment.appointmentTime.split('T')[1].slice(0, 5)}` : '--:--'}
                  </span>
                </div>
                {activeAppointment ? (
                  <>
                    <h4 className="mb-1 text-xl font-bold">{activeAppointment.patientName}</h4>
                    <p className="mb-4 text-xs opacity-90">Patient currently in consultation.</p>
                  </>
                ) : (
                  <>
                    <h4 className="mb-1 text-xl font-bold">No Active Patient</h4>
                    <p className="mb-4 text-xs opacity-90">Ready for next patient</p>
                  </>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1 bg-white text-orange-600 hover:bg-slate-50 border-none">View Record</Button>
                  <Button variant="secondary" size="sm" icon="edit" className="bg-white/20 text-white hover:bg-white/30 border-none" />
                </div>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-10">person</span>
            </Card>

            <Card title="Today's Breakdown" subtitle="DAILY PROGRESS">
              <div className="space-y-4">
                {breakdownItems.map((task) => (
                  <div key={task.title} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition-colors ${task.done ? 'border-orange-600 bg-orange-600' : 'border-slate-300'}`}>
                      {task.done && <span className="material-symbols-outlined text-[10px] text-white">check</span>}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${task.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>
                      <p className="text-[10px] font-medium text-slate-500">{task.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" fullWidth icon="add" className="mt-6 text-[10px] font-bold uppercase text-slate-400 border border-dashed border-slate-200">
                Add new task
              </Button>
            </Card>
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
