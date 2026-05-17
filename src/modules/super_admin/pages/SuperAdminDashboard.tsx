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
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';

export const SuperAdminDashboard = () => {
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [users, setUsers] = useState<UserSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [hospitalRes, userRes] = await Promise.all([
        hospitalService.list(),
        userService.listUsers(0, DEFAULT_PAGE_SIZE)
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
        {/* Info Pills Row - Visible only on mobile */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide md:hidden">
          <MetricCard 
            label="Live Nodes" 
            value={hospitals.length} 
            icon="hub" 
            variant="orange" 
            layout="pill" 
          />
          <MetricCard 
            label="System Load" 
            value="42%" 
            icon="speed" 
            variant="blue" 
            layout="pill" 
          />
          <MetricCard 
            label="Global Sessions" 
            value={users.length} 
            icon="sensors" 
            variant="emerald" 
            layout="pill" 
          />
          <MetricCard 
            label="Security" 
            value="Active" 
            icon="verified_user" 
            variant="purple" 
            layout="pill" 
          />
        </div>

        {/* Mobile Header - Visible only on small screens */}
        <div className="md:hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-700 rounded-full flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined">shield_person</span>
              </div>
              <div>
                <h1 className="font-headline-md text-slate-900 leading-tight">Super Admin</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global System Control</p>
              </div>
            </div>
          </div>
        </div>

        <PageHeading
          title="Admin Overview"
          description="System-wide monitoring and management dashboard."
          className="hidden md:flex"
        />

        {/* Mobile Specific Stats Section - Only visible on small screens */}
        <div className="md:hidden space-y-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Network Pulse</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-700 p-4 rounded-2xl text-white shadow-lg shadow-orange-700/20 flex flex-col justify-between h-32">
              <span className="material-symbols-outlined text-white/50 text-xl">apartment</span>
              <div>
                <p className="text-[32px] font-extrabold leading-none mb-1">{loading ? '...' : hospitals.length}</p>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Hospitals</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
              <span className="material-symbols-outlined text-blue-500 text-xl">group</span>
              <div>
                <p className="text-[32px] font-extrabold text-slate-900 leading-none mb-1">{loading ? '...' : users.length}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl text-white flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              </div>
              <div>
                <p className="text-xl font-black leading-none mb-1">Healthy</p>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">System Status</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Uptime</p>
              <p className="text-xs font-bold text-white">100%</p>
            </div>
          </div>
        </div>

        {/* Dynamic Stats Cards - Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            label="Total Hospitals" 
            value={loading ? '...' : hospitals.length} 
            variant="orange" 
            icon="apartment" 
            layout="horizontal" 
            trend="0%" // TO DO: derive from API
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <Card className="flex flex-col md:justify-center md:items-center md:text-center py-6 md:py-12">
            <div className="md:max-w-md md:mx-auto">
              <div className="flex items-center gap-4 mb-4 md:flex-col md:text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 md:w-16 md:h-16 md:bg-transparent md:opacity-20 md:mb-4">
                  <span className="material-symbols-outlined text-2xl text-orange-600 md:text-6xl">shield_person</span>
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-black text-slate-900 mb-1 leading-tight">Welcome, Super Admin</h2>
                  <p className="text-xs md:text-slate-500 font-medium md:mb-6">
                    Manage nodes, global users, and core system parameters.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 md:gap-3 md:justify-center mt-4">
                <Button href="/super_admin/hospitals" className="h-10 text-xs md:text-sm md:h-auto">Manage Hospitals</Button>
                <Button variant="secondary" href="/admin/medicines" className="h-10 text-xs md:text-sm md:h-auto">Medicine Master</Button>
                <Button variant="secondary" href="/admin/users" className="h-10 text-xs md:text-sm md:h-auto">Manage Users</Button>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-orange-600 border-none text-white p-6 md:p-8 min-h-[160px] md:min-h-[250px] flex flex-col justify-end shadow-lg shadow-orange-600/20 group">
            <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10">
              <span className="material-symbols-outlined text-6xl md:text-[120px]">health_and_safety</span>
            </div>
            <div className="relative z-10">
              <h4 className="text-lg md:text-2xl font-black text-white mb-1 leading-tight">Network Expansion</h4>
              <p className="text-[10px] md:text-sm text-white opacity-90 max-w-sm mb-4 leading-relaxed line-clamp-2">Adding new facilities requires verification of medical licenses and local compliance standards.</p>
              <Button variant="ghost" size="sm" href="/super_admin/hospitals" className="text-white hover:bg-white/10 w-fit p-0 h-auto text-xs md:text-sm">
                View Documentation <span className="material-symbols-outlined ml-1 text-xs md:text-sm">arrow_forward</span>
              </Button>
            </div>
          </Card>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
