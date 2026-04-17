'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import apiClient from '@/services/apiClient';
import { ApiResponse, AppointmentResponse } from '@/types/api';
import { User, Clipboard, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const DoctorDashboard = () => {
  const [queue, setQueue] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    waiting: 0,
    completed: 0,
    totalConsultations: 0,
  });

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<ApiResponse<{ content: AppointmentResponse[] }>>('/appointments?status=SCHEDULED');
        if (response.data.success) {
          const content = response.data.data?.content || [];
          setQueue(content);
          setStats({
            waiting: content.length,
            completed: 0, // In a real app, this would come from a different endpoint or filter
            totalConsultations: content.length,
          });
        }
      } catch (error) {
        console.error('Failed to fetch doctor queue', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  const columns = [
    { header: 'Queue #', accessor: (row: AppointmentResponse) => row.id },
    { header: 'Patient Name', accessor: (row: AppointmentResponse) => row.patientName },
    { header: 'Time', accessor: (row: AppointmentResponse) => new Date(row.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    { 
      header: 'Status', 
      accessor: (row: AppointmentResponse) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--warning-light)] text-[var(--warning)]">
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: AppointmentResponse) => (
        <Link 
          href={`/doctor/consultation/${row.id}`} 
          className="btn-primary text-xs"
        >
          Start Consultation
        </Link>
      )
    }
  ];

  return (
    <MainLayout title="Doctor Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex items-center space-x-4 border-l-4 border-[var(--primary)]">
          <div className="p-3 bg-[var(--primary-light)] rounded-full">
            <User className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Patients Waiting</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.waiting}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-l-4 border-[var(--success)]">
          <div className="p-3 bg-[var(--success-light)] rounded-full">
            <CheckCircle className="h-6 w-6 text-[var(--success)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Completed Today</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.completed}</p>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 border-l-4 border-[var(--info)]">
          <div className="p-3 bg-[var(--info-light)] rounded-full">
            <Clipboard className="h-6 w-6 text-[var(--info)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Total Appointments</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalConsultations}</p>
          </div>
        </Card>
      </div>

      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Patient Queue</h3>
      <Card>
        <Table columns={columns} data={queue} isLoading={loading} />
      </Card>
    </MainLayout>
  );
};

export default DoctorDashboard;
