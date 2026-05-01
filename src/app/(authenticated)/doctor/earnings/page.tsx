'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { RootState } from '@/state/store';
import { AppointmentResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';

const DoctorEarningsPage = () => {
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

  return (
    <MainLayout title="My Earnings">
      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-manrope">Earnings Overview</h1>
            <p className="text-slate-500">Track your performance and revenue for the selected period.</p>
          </div>
          
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
            <div className="flex flex-col px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm font-bold text-slate-700 outline-none"
              />
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex flex-col px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm font-bold text-slate-700 outline-none"
              />
            </div>
            <button 
              onClick={fetchData}
              className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Earnings', value: `₹${stats.totalEarnings}`, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'payments' },
            { label: 'Total Visits', value: stats.totalVisits, color: 'text-orange-600', bg: 'bg-orange-50', icon: 'group' },
            { label: 'Earned Visits', value: stats.earnedVisits, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'check_circle' },
            { label: 'Cancelled', value: stats.cancelled, color: 'text-rose-600', bg: 'bg-rose-50', icon: 'cancel' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Visit History</h3>
            <span className="text-xs text-slate-500 font-medium">{filteredAppointments.length} appointments found</span>
          </div>
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
                    return (
                      <tr 
                        key={app.id} 
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onDoubleClick={() => console.log('Appointment details:', app)}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{new Date(app.appointmentTime).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-500">{new Date(app.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{app.patientName}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                            app.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            app.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {statusCaptions[app.status] || app.status}
                          </span>
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
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorEarningsPage;
