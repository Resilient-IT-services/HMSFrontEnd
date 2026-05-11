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
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';

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
    const interval = setInterval(() => fetchData(true), 30_000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const consultationFee = useMemo(() => {
    if (!user || !user.currentHospitalId) return 0;
    const membership = user.memberships.find(m => m.hospitalId === user.currentHospitalId);
    if (!membership || !membership.roleAssignments) return 0;
    const doctorRole = membership.roleAssignments.find(ra => ra.roleCode === 'DOCTOR' && ra.active);
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
    'SCHEDULED': 'Scheduled',
    'COMPLETED': 'Completed',
    'PAYMENT_PENDING': 'Payment Pending',
    'WAITING_FOR_VITALS': 'Waiting for Vitals',
    'WALK_IN': 'In Progress',
    'CANCELLED': 'Cancelled',
    'ADD_VITALS': 'Add Vitals',
    'CHECKED_IN': 'Checked In'
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

  const handleStartNextConsultation = async () => {
    const nextAppointment = queue[0];
    if (!nextAppointment) {
      triggerGlobalToast('No patients in the queue', 'info');
      return;
    }

    handleStartConsultation(nextAppointment.id);
  };

  const columns: Column<AppointmentResponse>[] = [
    {
      header: 'Token',
      render: (a) => (
        <div className={`w-20 h-12 rounded-lg flex items-center justify-center font-bold text-lg bg-slate-100 text-slate-400 shrink-0 ${a.status === 'WALK_IN' ? 'bg-orange-100 text-orange-700' : ''}`}>
          {formatToken(a)}
        </div>
      )
    },
    {
      header: 'Patient Details',
      render: (a) => (
        <div>
          <h4 className="font-bold text-sm text-slate-900">{a.patientName}</h4>
          <p className="text-[10px] text-slate-500 uppercase font-black">
            Scheduled: {new Date(a.appointmentTime).toLocaleDateString()} {a.appointmentTime.split('T')[1].slice(0, 5)} • {a.notes || 'Routine Checkup'}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      render: (a) => {
        let variant: any = 'slate';
        if (a.status === 'WALK_IN') variant = 'blue';
        else if (a.status === 'SCHEDULED' || a.status === 'CHECKED_IN') variant = 'orange';
        else if (a.status === 'COMPLETED') variant = 'emerald';
        else if (a.status === 'CANCELLED') variant = 'red';

        return <Badge variant={variant}>{statusCaptions[a.status] || a.status}</Badge>;
      }
    },
    {
      header: '',
      render: () => (
        <button className="p-2 text-slate-300 hover:text-orange-600 transition-colors">
          <span className="material-symbols-outlined text-lg">more_vert</span>
        </button>
      ),
      className: 'text-right'
    }
  ];

  return (
    <MainLayout title="Doctor Dashboard" hideTitle>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full bg-[#f9f9ff] min-h-screen">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-center relative overflow-hidden shadow-sm gap-6">
            <div className="relative z-10 w-full lg:w-auto">
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 font-manrope">Good morning, Dr. {user?.fullName.split(' ')[0]}</h2>
              <p className="text-slate-500 max-w-lg">You have {stats.total} consultations scheduled for today. {stats.waiting} patients are currently in the queue.</p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button 
                  onClick={handleStartNextConsultation}
                  icon="play_arrow"
                >
                  Start Next Consultation
                </Button>
                <Button 
                  variant="secondary"
                  href="/doctor/patient-queue"
                  icon="list_alt"
                >
                  Go to Queue
                </Button>
              </div>
            </div>
            <div className="hidden lg:block absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-100/50 to-transparent" />
            <div className="hidden lg:flex items-center justify-center pr-8 z-10">
              <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined text-6xl">medical_services</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <MetricCard 
            label="Total Patients" 
            value={stats.total} 
            variant="orange" 
            trend="12%" 
            icon="trending_up" 
            layout="compact" 
            progressBar={100}
          />
          <MetricCard 
            label="Waiting" 
            value={stats.waiting} 
            variant="orange" 
            icon="hourglass_empty" 
            layout="compact" 
            progressBar={(stats.waiting / (stats.total || 1)) * 100}
          />
          <MetricCard 
            label="In Progress" 
            value={stats.active} 
            variant="blue" 
            icon="clinical_notes" 
            layout="compact" 
            progressBar={(stats.active / (stats.total || 1)) * 100}
          />
          <MetricCard 
            label="Completed" 
            value={stats.completed} 
            variant="emerald" 
            icon="check_circle" 
            layout="compact" 
            progressBar={(stats.completed / (stats.total || 1)) * 100}
          />
          <MetricCard 
            label="Today's Earnings" 
            value={`₹${stats.earnings}`} 
            variant="indigo" 
            icon="payments" 
            layout="compact" 
            progressBar={100}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <Card 
              title="Upcoming Patient Queue" 
              className="p-0 overflow-hidden h-full"
            >
              <Table 
                columns={columns} 
                data={queue} 
                isLoading={loading}
                onRowDoubleClick={(a) => handleStartConsultation(a.id)}
                emptyMessage="No patients in the queue for today."
              />
            </Card>
          </section>

          <div className="flex flex-col gap-6">
            {/* Current Visit Card */}
            <div className="bg-orange-600 text-white p-6 rounded-xl border border-orange-500 relative overflow-hidden shadow-lg shadow-orange-600/20">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-white/20 text-white border-transparent">Current Visit</Badge>
                  <span className="text-[10px] font-mono font-bold">
                    {activeAppointment ? `${new Date(activeAppointment.appointmentTime).toLocaleDateString()} ${activeAppointment.appointmentTime.split('T')[1].slice(0, 5)}` : '--:--'}
                  </span>
                </div>
                {activeAppointment ? (
                  <>
                    <h4 className="text-xl font-bold mb-1">{activeAppointment.patientName}</h4>
                    <p className="text-xs opacity-90 mb-4">Patient currently in consultation.</p>
                  </>
                ) : (
                  <>
                    <h4 className="text-xl font-bold mb-1">No Active Patient</h4>
                    <p className="text-xs opacity-90 mb-4">Ready for next patient</p>
                  </>
                )}
                <div className="flex gap-2">
                  <button className="flex-1 bg-white text-orange-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">View Record</button>
                  <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                </div>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10">person</span>
            </div>

            {/* Breakdown Card */}
            <Card title="Today's Breakdown" subtitle="DAILY PROGRESS">
              <div className="space-y-4">
                {[
                  { title: 'Scheduled visits', sub: `${stats.waiting} appointments are queued.`, done: false },
                  { title: 'Active consultations', sub: `${stats.active} appointments are in progress.`, done: stats.active > 0 },
                  { title: 'Completed visits', sub: `${stats.completed} appointments are finished.`, done: stats.completed > 0 }
                ].map((task, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${task.done ? 'bg-orange-600 border-orange-600' : 'border-slate-300'}`}>
                      {task.done && <span className="material-symbols-outlined text-[10px] text-white">check</span>}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${task.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{task.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 border border-dashed border-slate-200 rounded-lg text-slate-400 text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors">
                + Add new task
              </button>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
