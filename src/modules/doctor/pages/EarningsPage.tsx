'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { RootState } from '@/state/store';
import { AppointmentResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetricsGrid } from '@/components/ui/MetricsGrid';

export const EarningsPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(lastMonthStr);
  const [endDate, setEndDate] = useState(today);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Fetching a larger set of appointments to filter on frontend 
      // since backend doesn't support date range directly in list_7
      const response = await appointmentService.list(0, 1000, undefined, undefined, user.id);

      if (!response.success || !response.data) {
        setAppointments([]);
        return;
      }

      setAppointments(response.data.content);
    } catch (error) {
      console.error(error);
      triggerGlobalToast('Failed to fetch appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const consultationFee = useMemo(() => {
    if (!user || !user.currentHospitalId) return 0;
    const membership = user.memberships.find(m => m.hospitalId === user.currentHospitalId);
    if (!membership || !membership.roleAssignments) return 0;
    const doctorRole = membership.roleAssignments.find(ra => ra.roleCode === 'DOCTOR' && ra.active);
    return doctorRole?.doctorDetails?.consultationFee || 0;
  }, [user]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appDate = app.appointmentTime.split('T')[0];
      return appDate >= startDate && appDate <= endDate;
    });
  }, [appointments, startDate, endDate]);

  const stats = useMemo(() => {
    const earnedAppointments = filteredAppointments.filter(
      app => app.status !== 'CANCELLED' && app.status !== 'PAYMENT_PENDING'
    );
    
    const totalEarnings = earnedAppointments.length * consultationFee;
    
    return {
      totalVisits: filteredAppointments.length,
      earnedVisits: earnedAppointments.length,
      totalEarnings,
      cancelled: filteredAppointments.filter(app => app.status === 'CANCELLED').length,
    };
  }, [filteredAppointments, consultationFee]);

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

  const metricItems = [
    { label: 'Total Earnings', value: `₹${stats.totalEarnings}`, variant: 'indigo' as const, icon: 'payments' },
    { label: 'Total Visits', value: stats.totalVisits, variant: 'orange' as const, icon: 'group' },
    { label: 'Earned Visits', value: stats.earnedVisits, variant: 'emerald' as const, icon: 'check_circle' },
    { label: 'Cancelled', value: stats.cancelled, variant: 'red' as const, icon: 'cancel' }
  ];

  return (
    <MainLayout title="My Earnings" hideTitle>
      <PageSurface paddingClassName="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <PageHeading 
            title="Earnings Overview" 
            description="Track your performance and revenue for the selected period."
            className="mb-0"
          />
          
          <Card className="p-2 flex items-center gap-2 shadow-sm" noPadding>
            <div className="flex flex-col px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm font-bold text-slate-700 outline-none bg-transparent"
              />
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex flex-col px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm font-bold text-slate-700 outline-none bg-transparent"
              />
            </div>
            <Button 
              onClick={fetchData}
              icon="refresh"
              size="sm"
            />
          </Card>
        </div>

        <MetricsGrid items={metricItems} className="mb-8" />

        <Card title="Visit History" subtitle={`${filteredAppointments.length} appointments found`} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Earning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading records...</td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No appointments found for the selected period.</td>
                  </tr>
                ) : (
                  filteredAppointments.sort((a, b) => b.appointmentTime.localeCompare(a.appointmentTime)).map((app) => {
                    const isEarned = app.status !== 'CANCELLED' && app.status !== 'PAYMENT_PENDING';
                    let badgeVariant: 'emerald' | 'red' | 'slate' | 'orange' | 'blue' = 'slate';
                    if (app.status === 'COMPLETED') badgeVariant = 'emerald';
                    else if (app.status === 'CANCELLED') badgeVariant = 'red';
                    else if (app.status === 'WALK_IN') badgeVariant = 'blue';
                    else if (app.status === 'SCHEDULED' || app.status === 'CHECKED_IN') badgeVariant = 'orange';

                    return (
                      <tr 
                        key={app.id} 
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{new Date(app.appointmentTime).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-500">{new Date(app.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{app.patientName}</td>
                        <td className="px-6 py-4">
                          <Badge variant={badgeVariant}>
                            {statusCaptions[app.status] || app.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${isEarned ? 'text-slate-900' : 'text-slate-300'}`}>
                            ₹{isEarned ? consultationFee : 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </PageSurface>
    </MainLayout>
  );
};
