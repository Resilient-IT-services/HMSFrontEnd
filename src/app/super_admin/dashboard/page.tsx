'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/ui/MainLayout';
import apiClient from '@/services/apiClient';
import { ApiResponse, HospitalResponse, UserResponse } from '@/types/api';

const SuperAdminDashboard = () => {
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const hospitalRes = await apiClient.get<ApiResponse<HospitalResponse[]>>('/hospitals');
      if (hospitalRes.data.success) {
        setHospitals(hospitalRes.data.data || []);
      }

      const userRes = await apiClient.get<ApiResponse<UserResponse[]>>('/users');
      if (userRes.data.success) {
        setUsers(userRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <MainLayout title="System Administration">
      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--primary-light)] rounded-lg text-[var(--primary)]">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <span className="text-[var(--success)] text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> Live
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Registered Hospitals</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">
            {hospitals.length}
          </h3>
        </div>
        
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--info-light)] rounded-lg text-[var(--info)]">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="text-[var(--primary)] text-xs font-bold flex items-center gap-1">
              Total Count
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Total System Users</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">
            {loading ? '...' : users.length}
          </h3>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--success-light)] rounded-lg text-[var(--success)]">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <span className="bg-[var(--success-light)] text-[var(--success)] text-[10px] font-black px-2 py-0.5 rounded-full">HEALTHY</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">API Server Status</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">Connected</h3>
        </div>
      </div>

      <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] text-center">
        <div className="max-w-md mx-auto">
          <span className="material-symbols-outlined text-6xl text-[var(--primary)] opacity-20 mb-4">shield_person</span>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome, Super Administrator</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Use the sidebar to manage hospitals, global users, and system-wide settings.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/super_admin/hospitals" className="btn-primary">Manage Hospitals</Link>
            <Link href="/admin/users" className="btn-secondary">Manage Users</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SuperAdminDashboard;
