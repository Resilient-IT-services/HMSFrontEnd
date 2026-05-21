'use client';

import React, { useEffect, useState } from 'react';
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

  const quickActions = [
    { label: 'Manage Hospitals', href: '/super_admin/hospitals', icon: 'apartment', variant: 'primary' as const },
    { label: 'Medicine Master', href: '/admin/medicines', icon: 'medication', variant: 'secondary' as const },
    { label: 'Manage Users', href: '/admin/users', icon: 'group', variant: 'secondary' as const },
    { label: 'System Settings', href: '/settings', icon: 'admin_panel_settings', variant: 'secondary' as const },
  ];

  const quickStats = [
    { label: 'Active Hospitals', value: loading ? '...' : hospitals.length, icon: 'local_hospital' },
    { label: 'Total Users', value: loading ? '...' : users.length, icon: 'groups' },
    { label: 'System Status', value: 'Healthy', icon: 'verified' },
  ];

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
          <Card className="relative overflow-hidden min-h-[420px] h-full rounded-3xl border-orange-100/80 bg-gradient-to-br from-white via-orange-50/55 to-slate-50 shadow-xl shadow-slate-200/70">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-orange-100/60 blur-2xl"></div>
            <div className="absolute bottom-0 left-8 h-32 w-32 rounded-full bg-emerald-100/50 blur-3xl"></div>

            <div className="relative z-10 flex h-full flex-col justify-between gap-7">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/85 text-orange-600 shadow-lg shadow-orange-200/40 backdrop-blur">
                    <span className="material-symbols-outlined text-4xl">health_and_safety</span>
                  </div>
                  <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 sm:flex">
                    Operational
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-orange-600">Super Admin Workspace</p>
                  <h2 className="text-2xl font-black leading-tight text-slate-950 md:text-4xl">Welcome back, Super Admin</h2>
                  <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600 md:text-base">
                    Manage hospitals, users, medicines, and global settings from one clean command center.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    href={action.href}
                    icon={action.icon}
                    variant={action.variant}
                    className="h-12 justify-start rounded-2xl px-4 text-xs normal-case tracking-normal hover:-translate-y-0.5 hover:shadow-lg md:text-sm"
                    fullWidth
                  >
                    {action.label}
                  </Button>
                ))}
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Quick Stats</h3>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]"></span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {quickStats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/80 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
                        <p className="text-sm font-black text-slate-900">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-3xl border-none min-h-[360px] md:min-h-[420px] h-full shadow-xl">

            {/* Background Image */}
            <img
                src="/images/healthcare-banner.jpg"
                alt="Healthcare Banner"
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Dark/Light Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent"></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center h-full p-6 md:p-10 max-w-full sm:max-w-[60%]">

              <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
                Better Care.
                <br />
                Smarter Systems.
                <br />
                Stronger Tomorrow.
              </h2>

              <p className="text-sm md:text-lg text-slate-700 leading-relaxed mb-8">
                Empowering healthcare with technology that connects,
                simplifies, and saves lives.
              </p>

              <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm font-semibold text-slate-700">
                <span>Secure</span>
                <span>Connected</span>
                <span>Reliable</span>
                <span>Scalable</span>
              </div>

            </div>
          </Card>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
