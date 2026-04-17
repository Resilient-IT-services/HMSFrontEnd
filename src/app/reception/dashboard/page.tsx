'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import apiClient from '@/services/apiClient';
import { ApiResponse, AppointmentResponse } from '@/types/api';
import { Plus, Users, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

const ReceptionDashboard = () => {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingConsultations: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // In a real app, these would be separate service calls
        const appointmentsRes = await apiClient.get<ApiResponse<{ content: AppointmentResponse[] }>>('/appointments?size=10');
        const patientsRes = await apiClient.get<ApiResponse<{ totalElements: number }>>('/patients?size=1');
        
        if (appointmentsRes.data.success) {
          setAppointments(appointmentsRes.data.data?.content || []);
          setStats(prev => ({
            ...prev,
            todayAppointments: appointmentsRes.data.data?.content.length || 0,
            pendingConsultations: appointmentsRes.data.data?.content.filter(a => a.status === 'SCHEDULED').length || 0,
          }));
        }

        if (patientsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalPatients: patientsRes.data.data?.totalElements || 0,
          }));
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
    { header: 'Patient Name', accessor: (row: AppointmentResponse) => row.patientName },
    { header: 'Doctor', accessor: (row: AppointmentResponse) => row.doctorName },
    { header: 'Time', accessor: (row: AppointmentResponse) => new Date(row.appointmentTime).toLocaleTimeString() },
    { 
      header: 'Status', 
      accessor: (row: AppointmentResponse) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'COMPLETED' ? 'bg-[var(--success-light)] text-[var(--success)]' :
          row.status === 'CANCELLED' ? 'bg-[var(--error-light)] text-[var(--error)]' :
          'bg-[var(--primary-light)] text-[var(--primary)]'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: AppointmentResponse) => (
        <button className="text-[var(--primary)] hover:underline">View</button>
      )
    }
  ];

  return (
    <MainLayout title="Reception Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-[var(--primary-light)] rounded-full">
            <Users className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Total Patients</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalPatients}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-[var(--success-light)] rounded-full">
            <Calendar className="h-6 w-6 text-[var(--success)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Today's Appointments</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.todayAppointments}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-3 bg-[var(--warning-light)] rounded-full">
            <Clock className="h-6 w-6 text-[var(--warning)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Pending Consultations</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.pendingConsultations}</p>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recent Appointments</h3>
        <div className="space-x-4">
          <Link href="/reception/patients/new" className="btn-primary inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Patient
          </Link>
          <Link href="/reception/appointments/new" className="btn-primary inline-flex items-center bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Link>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={appointments} isLoading={loading} />
      </Card>
    </MainLayout>
  );
};

export default ReceptionDashboard;
