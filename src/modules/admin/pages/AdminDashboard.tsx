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
import { userService } from '@/services/userService';
import { hospitalService } from '@/services/hospitalService';
import { UserSummaryDTO, HospitalResponse } from '@/types/api';
import { useRouter } from 'next/navigation';

export const AdminDashboard = () => {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummaryDTO[]>([]);
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, hospRes] = await Promise.all([
          userService.listUsers(0, 100),
          hospitalService.list(0, 100)
        ]);

        if (userRes.success) setUsers(userRes.data?.content || []);
        if (hospRes.success) setHospitals(hospRes.data?.content || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const activeNow = users.filter(u => u.active).length;
    const doctors = users.filter(u => {
        const roles = new Set<string>();
        if (u.memberships) for (const m of u.memberships) m.roleAssignments?.forEach((ra: any) => roles.add(ra.roleCode));
        return roles.has('DOCTOR');
    }).length;

    return {
      totalHospitals: hospitals.length,
      platformUsers: users.length,
      activeNow,
      certifiedDoctors: doctors
    };
  }, [users, hospitals]);

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
          {new Date(h.createdAt).toLocaleDateString()}
        </p>
      )
    }
  ];

  return (
    <MainLayout title="Admin Overview">
      <PageSurface>
        <PageHeading 
          title="Admin Overview" 
          description="Real-time health indicators and administrative network status."
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
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                          {new Date(h.createdAt).toLocaleDateString()}
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
                <div className="grid grid-cols-2 gap-3">
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
                      className="flex-col h-auto py-4 px-2"
                    >
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-orange-700 mb-2">{act.icon}</span>
                      <span className="text-[10px] font-bold text-slate-600">{act.label}</span>
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="bg-orange-700 border-none shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none"></div>
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold font-manrope leading-none">System Integrity</h3>
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1 opacity-90 uppercase tracking-widest">Server Load</div>
                      <div className="h-1.5 bg-white/20 rounded-full">
                        <div className="h-full bg-white rounded-full w-[42%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1 opacity-90 uppercase tracking-widest">DB Latency</div>
                      <div className="h-1.5 bg-white/20 rounded-full">
                        <div className="h-full bg-white rounded-full w-[12%]"></div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 text-[11px] leading-relaxed opacity-80">All clusters are performing within optimal parameters. No outages reported in the last 72 hours.</p>
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
