'use client';

import React, { useEffect, useState, useMemo } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Avatar } from '@/components/ui/Avatar';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Table, Column } from '@/components/ui/Table';
import { adminService } from '@/services/adminService';
import { hospitalService } from '@/services/hospitalService';
import { HospitalResponse } from '@/types/api';
import { useRouter } from 'next/navigation';
import dayjs from '@/lib/dayjs';

export const AdminDashboard = () => {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalHospitals: 0,
    platformUsers: 0,
    activeNow: 0,
    certifiedDoctors: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use optimized unified stats endpoint and selection list for the table
        const [hospRes, statsRes] = await Promise.all([
          hospitalService.list(0, 5), // Fetch top 5 for the activity table
          adminService.getAdminStats() // Unified metrics
        ]);

        if (hospRes.success && hospRes.data) {
          setHospitals(hospRes.data.content || []);
        }

        if (statsRes.success && statsRes.data) {
          setStats({
            totalHospitals: statsRes.data.totalHospitals,
            platformUsers: statsRes.data.totalUsers,
            activeNow: statsRes.data.activeUsers,
            certifiedDoctors: statsRes.data.totalDoctors
          });
        }
      } catch (error) {
        console.error('Admin Dashboard Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns: Column<HospitalResponse>[] = [
    {
      header: 'Hospital Entity',
      render: (h) => (
        <div className="flex items-center gap-3">
          <Avatar name={h.name} variant="orange" />
          <div>
            <p className="text-sm font-bold text-slate-900">{h.name}</p>
            <p className="text-xs text-slate-400">{h.code}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      render: (h) => (
        <StatusIndicator 
          status={h.status === 'ACTIVE' ? 'Fully Integrated' : h.status}
          variant={h.status === 'ACTIVE' ? 'emerald' : 'orange'}
        />
      )
    },
    {
      header: 'Daily Users',
      render: () => (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-slate-700">85%</p>
          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[85%]"></div>
          </div>
        </div>
      )
    },
    {
      header: 'Last Sync',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (h) => (
        <p className="font-bold text-slate-500 text-xs">
          {dayjs(h.createdAt).format('DD MMM YYYY')}
        </p>
      )
    }
  ];

  return (
    <MainLayout title="Admin Overview">
      <PageSurface>
        {/* Info Pills Row - Visible only on mobile */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide md:hidden">
          <MetricCard 
            label="Network Nodes" 
            value={hospitals.length} 
            icon="hub" 
            variant="orange" 
            layout="pill" 
          />
          <MetricCard 
            label="Daily Traffic" 
            value="85%" 
            icon="query_stats" 
            variant="blue" 
            layout="pill" 
          />
          <MetricCard 
            label="Staff Online" 
            value={stats.activeNow} 
            icon="badge" 
            variant="emerald" 
            layout="pill" 
          />
          <MetricCard 
            label="Compliance" 
            value="100%" 
            icon="gavel" 
            variant="purple" 
            layout="pill" 
          />
        </div>

        {/* Mobile Header - Visible only on small screens */}
        <div className="md:hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700">
                <span className="material-symbols-outlined">shield_person</span>
              </div>
              <div>
                <h1 className="font-headline-md text-slate-900 leading-tight">Admin Overview</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Command Center</p>
              </div>
            </div>
          </div>
        </div>

        <PageHeading 
          title="Admin Overview" 
          description="Real-time health indicators and administrative network status."
          className="hidden md:flex"
        >
          <Button variant="secondary" icon="calendar_today">
            Last 30 Days
          </Button>
          <Button 
            onClick={() => router.push('/super_admin/hospitals')}
            icon="add"
          >
            Onboard Hospital
          </Button>
        </PageHeading>

        <div className="space-y-8">
          {/* Mobile Specific Stats Section - Only visible on small screens */}
          <div className="md:hidden space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Pulse</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Live</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-700 p-4 rounded-2xl text-white shadow-lg shadow-orange-700/20 flex flex-col justify-between h-32">
                <span className="material-symbols-outlined text-white/50 text-xl">apartment</span>
                <div>
                  <p className="text-[32px] font-extrabold leading-none mb-1">{stats.totalHospitals}</p>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Facilities</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
                <span className="material-symbols-outlined text-blue-500 text-xl">group</span>
                <div>
                  <p className="text-[32px] font-extrabold text-slate-900 leading-none mb-1">{stats.platformUsers}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl text-white flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-400">bolt</span>
                </div>
                <div>
                  <p className="text-2xl font-black leading-none mb-1">{stats.activeNow}</p>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Active Sessions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Health</p>
                <p className="text-xs font-bold text-white">Pending</p>
              </div>
            </div>
          </div>

          {/* Stats Grid - Hidden on Mobile, Visible on Desktop */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard label="Total Hospitals" value={stats.totalHospitals} icon="apartment" variant="orange" trend="+12%" layout="horizontal" />
            <MetricCard label="Platform Users" value={stats.platformUsers} icon="group" variant="blue" trend="+5.4%" layout="horizontal" />
            <MetricCard label="Active Now" value={stats.activeNow} icon="bolt" variant="emerald" pulse layout="horizontal" />
            <MetricCard label="Certified Doctors" value={stats.certifiedDoctors} icon="medical_services" variant="purple" trend="Stable" layout="horizontal" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Table Area */}
            <Card 
              title="Network Activity" 
              className="lg:col-span-8 p-0 overflow-hidden"
              headerActions={
                <Button variant="ghost" size="sm" onClick={() => router.push('/super_admin/hospitals')}>
                  View All Records
                </Button>
              }
            >
              <Table 
                columns={columns}
                data={hospitals.slice(0, 5)}
                isLoading={loading}
                onRowDoubleClick={(h) => router.push(`/super_admin/hospitals/${h.id}`)}
                renderMobileCard={(h) => (
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => router.push(`/super_admin/hospitals/${h.id}`)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={h.name} variant="orange" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{h.name}</p>
                          <p className="text-xs text-slate-400">{h.code}</p>
                        </div>
                      </div>
                      <StatusIndicator 
                        status={h.status === 'ACTIVE' ? 'Fully Integrated' : h.status}
                        variant={h.status === 'ACTIVE' ? 'emerald' : 'orange'}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Daily Users</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-700">85%</p>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[85%]"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Sync</p>
                        <p className="font-bold text-slate-500 text-xs">
                          {dayjs(h.createdAt).format('DD MMM YYYY')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              />
            </Card>

            {/* Sidebar Info */}
            <div className="lg:col-span-4 space-y-6">
              <Card title="Quick Actions">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                  {[
                    { label: 'New Branch', icon: 'add_business', href: '/super_admin/hospitals' },
                    { label: 'Hire Admin', icon: 'person_add', href: '/admin/users/create' },
                    { label: 'Audit Logs', icon: 'analytics', href: '#' },
                    { label: 'Backups', icon: 'cloud_download', href: '#' }
                  ].map((act, i) => (
                    <Button 
                      key={i} 
                      variant="secondary"
                      onClick={() => act.href !== '#' && router.push(act.href)}
                      className="flex-col h-auto py-4 px-2 active:bg-orange-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-orange-700 mb-2">{act.icon}</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{act.label}</span>
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="bg-orange-700 border-none shadow-lg relative overflow-hidden group min-h-[160px] flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none"></div>
                <div className="relative z-10 text-white p-2">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-bold font-manrope leading-none">System Integrity</h3>
                    <span className="material-symbols-outlined text-white/50">verified_user</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-black mb-1.5 opacity-80 uppercase tracking-[0.15em]">Server Load</div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full w-[42%] shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-black mb-1.5 opacity-80 uppercase tracking-[0.15em]">DB Latency</div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full w-[12%] shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 text-[10px] md:text-[11px] leading-relaxed opacity-70 font-medium">All clusters are performing within optimal parameters. No outages reported in the last 72 hours.</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <p>© 2026 CareFlow <span className="text-[10px] opacity-70 italic ml-1">by Resilient</span>. All records encrypted via AES-256-GCM.</p>
            <div className="flex gap-6">
              <a className="hover:text-orange-700 transition-colors" href="#">Compliance</a>
              <a className="hover:text-orange-700 transition-colors" href="#">Privacy</a>
              <a className="hover:text-orange-700 transition-colors" href="#">Security</a>
            </div>
          </footer>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
