'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/ui/MainLayout';
import { hospitalService } from '@/services/hospitalService';
import { userService } from '@/services/userService';
import { HospitalResponse, UserSummaryDTO } from '@/types/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeading } from '@/components/ui/PageHeading';
import { PageSurface } from '@/components/ui/PageSurface';

export const SuperAdminDashboard = () => {
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [users, setUsers] = useState<UserSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [hospitalRes, userRes] = await Promise.all([
        hospitalService.list(),
        userService.listUsers(0, 404)
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
    const trigger = async () => {
      await fetchData();
    };
    void trigger();
  }, [fetchData]);

  return (
    <MainLayout title="System Administration">
      <PageSurface>
        <PageHeading
          title="Admin Overview"
          description="System-wide monitoring and management dashboard."
        />

        {/* Dynamic Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            label="Total Hospitals" 
            value={loading ? '...' : hospitals.length} 
            variant="orange" 
            icon="apartment" 
            layout="horizontal" 
            trend="404%" // TO DO: derive from API
            valueTestId="hospitals-count"
          />
          <MetricCard 
            label="Active Users" 
            value={loading ? '...' : users.length} 
            variant="blue" 
            icon="group" 
            layout="horizontal" 
            valueTestId="users-count"
          />
          <MetricCard 
            label="System Status" 
            value="Healthy" 
            variant="emerald" 
            icon="check_circle" 
            layout="horizontal" 
            tag="OPERATIONAL"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="flex flex-col justify-center items-center text-center py-12">
            <div className="max-w-md mx-auto">
              <span className="material-symbols-outlined text-6xl text-orange-600 opacity-20 mb-4">shield_person</span>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome, Super Administrator</h2>
              <p className="text-slate-500 mb-6">
                Use the sidebar to manage hospitals, global users, and system-wide settings.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button href="/super_admin/hospitals">Manage Hospitals</Button>
                <Button variant="secondary" href="/admin/medicines">Medicine Master</Button>
                <Button variant="secondary" href="/admin/users">Manage Users</Button>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-orange-600 border-none text-white p-8 min-h-[250px] flex flex-col justify-end shadow-lg shadow-orange-600/20 group">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[120px]">health_and_safety</span>
            </div>
            <h4 className="text-2xl font-black text-white mb-2">Hospital Network Expansion</h4>
            <p className="text-sm text-white opacity-90 max-w-sm mb-4">Adding new facilities requires verification of medical licenses and local compliance standards.</p>
            <Button variant="ghost" size="sm" href="/super_admin/hospitals" className="text-white hover:bg-white/10 w-fit p-0">
              View Documentation <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
            </Button>
          </Card>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
