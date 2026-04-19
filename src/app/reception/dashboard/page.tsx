'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import apiClient from '@/services/apiClient';
import { ApiResponse, AppointmentResponse } from '@/types/api';

const ReceptionDashboard = () => {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const appointmentsRes = await apiClient.get<ApiResponse<{ content: AppointmentResponse[] }>>('/appointments?size=10');
        
        if (appointmentsRes.data.success) {
          setAppointments(appointmentsRes.data.data?.content || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const columns = [
    { 
      header: 'Patient Name', 
      accessor: (row: AppointmentResponse) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-[var(--primary)]">person</span>
          </div>
          <span className="font-semibold text-[var(--text-primary)]">{row.patientName}</span>
        </div>
      )
    },
    { header: 'Doctor', accessor: (row: AppointmentResponse) => row.doctorName },
    { header: 'Time', accessor: (row: AppointmentResponse) => new Date(row.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    { 
      header: 'Status', 
      accessor: (row: AppointmentResponse) => {
        let statusClass = 'bg-[var(--warning-light)] text-[var(--warning)]';
        if (row.status === 'COMPLETED') {
          statusClass = 'bg-[var(--success-light)] text-[var(--success)]';
        } else if (row.status === 'CANCELLED') {
          statusClass = 'bg-[var(--error-light)] text-[var(--error)]';
        }

        return (
          <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${statusClass}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Action',
      accessor: () => (
        <button className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
          <span className="material-symbols-outlined text-xl">open_in_new</span>
        </button>
      )
    }
  ];

  return (
    <MainLayout title="Reception Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="1,284" subtitle="Total Patients" icon="groups" />
        <Card title="42" subtitle="Today's Appointments" icon="event_available" />
        <Card title="15" subtitle="Pending Triage" icon="vital_signs" />
        <Card title="₹12,450" subtitle="Today's Revenue" icon="payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card title="Recent Appointments">
            <Table columns={columns} data={appointments} isLoading={loading} />
          </Card>
        </div>

        <div className="space-y-8">
          <Card title="Recent Activity" icon="history">
            <div className="space-y-6 mt-4">
              <div className="flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 ring-4 ring-[var(--primary)]/10"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-[var(--text-primary)]">New Registration</p>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">2 min ago</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Patient Elena Gilbert registered.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-[var(--warning)] shrink-0 ring-4 ring-[var(--warning)]/10"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Appointment Booked</p>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">15 min ago</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Damon S. booked with Dr. Stefan.</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card title="Weekly Trend" icon="analytics">
            <div className="flex items-end justify-between h-32 px-4 gap-2 mt-4">
              <div className="h-[40%] flex-1 rounded-t-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] transition-all"></div>
              <div className="h-[65%] flex-1 rounded-t-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] transition-all"></div>
              <div className="h-[55%] flex-1 rounded-t-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] transition-all"></div>
              <div className="h-[80%] flex-1 rounded-t-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] transition-all"></div>
              <div className="h-[95%] flex-1 rounded-t-lg bg-[var(--primary)] transition-all"></div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReceptionDashboard;
