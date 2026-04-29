'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/ui/MainLayout';
import { hospitalService } from '@/services/hospitalService';
import { userService } from '@/services/userService';
import { HospitalResponse, UserSummaryDTO } from '@/types/api';

const SuperAdminDashboard = () => {
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [users, setUsers] = useState<UserSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [hospitalRes, userRes] = await Promise.all([
        hospitalService.list(),
        userService.listUsers(0, 100)
      ]);
      
      if (hospitalRes.success && hospitalRes.data) {
        setHospitals(hospitalRes.data.content || []);
      }
      if (userRes.success && userRes.data) {
        setUsers(userRes.data.content || []);
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
      <div className="mb-8">
        <h2 className="font-headline-xl text-[var(--on-surface)]">Admin Overview</h2>
        <p className="font-body-md text-[var(--on-surface-variant)]">System-wide monitoring and management dashboard.</p>
      </div>

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-[var(--outline-variant)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full">+2 this month</span>
          </div>
          <p className="text-[var(--on-surface-variant)] text-xs font-bold uppercase tracking-wider">Total Hospitals</p>
          <h3 className="text-2xl font-bold text-[var(--on-surface)] mt-1" data-testid="hospitals-count">
            {loading ? '...' : hospitals.length}
          </h3>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-[var(--outline-variant)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <p className="text-[var(--on-surface-variant)] text-xs font-bold uppercase tracking-wider">Active Users</p>
          <h3 className="text-2xl font-bold text-[var(--on-surface)] mt-1" data-testid="users-count">
            {loading ? '...' : users.length}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[var(--outline-variant)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <span className="bg-green-50 text-green-600 text-[10px] font-black px-2 py-0.5 rounded-full">OPERATIONAL</span>
          </div>
          <p className="text-[var(--on-surface-variant)] text-xs font-bold uppercase tracking-wider">System Status</p>
          <h3 className="text-2xl font-bold text-[var(--on-surface)] mt-1">Healthy</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-[var(--outline-variant)] flex flex-col justify-center items-center text-center">
          <div className="max-w-md mx-auto">
            <span className="material-symbols-outlined text-6xl text-[var(--primary)] opacity-20 mb-4">shield_person</span>
            <h2 className="font-headline-md text-[var(--on-surface)] mb-2">Welcome, Super Administrator</h2>
            <p className="font-body-md text-[var(--on-surface-variant)] mb-6">
              Use the sidebar to manage hospitals, global users, and system-wide settings.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/super_admin/hospitals" className="btn-primary">Manage Hospitals</Link>
              <Link href="/admin/users" className="btn-secondary">Manage Users</Link>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[var(--primary)] text-white p-8 min-h-[250px] flex flex-col justify-end">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined text-[120px]">health_and_safety</span>
          </div>
          <h4 className="font-headline-sm text-white mb-2">Hospital Network Expansion</h4>
          <p className="font-body-sm text-white opacity-90 max-w-sm mb-4">Adding new facilities requires verification of medical licenses and local compliance standards.</p>
          <Link href="/super_admin/hospitals" className="inline-flex items-center text-xs font-bold uppercase tracking-widest hover:underline">
            View Documentation <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default SuperAdminDashboard;
