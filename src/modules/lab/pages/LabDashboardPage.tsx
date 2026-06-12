'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Card } from '@/components/ui/Card';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { labApi, HospitalLabDashboardStatsDTO, LabQueueItemDTO } from '@/modules/lab/api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/utils/formatters';
import Link from 'next/link';

const LabDashboardPage = () => {
  const [stats, setStats] = useState<HospitalLabDashboardStatsDTO | null>(null);
  const [pendingQueue, setPendingQueue] = useState<LabQueueItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, queueRes] = await Promise.all([
          labApi.getDashboardStats(),
          labApi.getPagedQueue('PENDING', 0, 5)
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (queueRes.success && queueRes.data) {
          setPendingQueue(queueRes.data.content);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        triggerGlobalToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const queueColumns: Column<LabQueueItemDTO>[] = [
    {
      header: 'Patient',
      render: (item) => (
        <div>
          <p className="text-sm font-bold text-slate-800">{item.patientName}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.patientId}</p>
        </div>
      )
    },
    {
      header: 'Test',
      render: (item) => <span className="text-sm font-bold text-slate-700">{item.testName}</span>
    },
    {
      header: 'Ordered At',
      render: (item) => <span className="text-xs font-bold text-slate-500">{formatDateTime(item.orderedAt)}</span>
    },
    {
      header: 'Status',
      render: (item) => (
        <Badge variant="orange" size="sm">
          {item.status.replace('_', ' ')}
        </Badge>
      )
    }
  ];

  return (
    <MainLayout title="Laboratory Dashboard">
      <PageSurface>
        <div className="space-y-6 py-4">
          <PageHeading
            title="Laboratory Overview"
            description="Quick summary of daily operations and pending tasks."
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Collection</p>
                  <h3 className="text-3xl font-black text-slate-800">{stats?.todayPendingOrders || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-500 text-2xl">pending_actions</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">In Processing</p>
                  <h3 className="text-3xl font-black text-slate-800">{stats?.todayProcessingOrders || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500 text-2xl">microbiology</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Verified Reports</p>
                  <h3 className="text-3xl font-black text-slate-800">{stats?.todayVerifiedReports || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-500 text-2xl">verified</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Access Queue */}
            <div className="lg:col-span-2">
              <ContentPanel className="h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-800">Recent Pending Orders</h3>
                  <Link href="/lab_admin/queue">
                    <Button variant="ghost" size="sm" className="font-bold text-primary">
                      View Full Queue <span className="material-symbols-outlined ml-1">arrow_forward</span>
                    </Button>
                  </Link>
                </div>
                <Table
                  columns={queueColumns}
                  data={pendingQueue}
                  isLoading={loading}
                  emptyMessage="No pending collections found."
                />
              </ContentPanel>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-black text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/lab_admin/queue" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-colors group">
                    <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">biotech</span>
                    <span className="font-bold text-slate-700">Go to Work Queue</span>
                  </Link>
                  <Link href="/lab_admin/reports" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group">
                    <span className="material-symbols-outlined text-emerald-500 text-2xl group-hover:scale-110 transition-transform">description</span>
                    <span className="font-bold text-slate-700">Lab Reports</span>
                  </Link>
                  <Link href="/lab_admin/inventory" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                    <span className="material-symbols-outlined text-blue-500 text-2xl group-hover:scale-110 transition-transform">inventory</span>
                    <span className="font-bold text-slate-700">Inventory Status</span>
                  </Link>
                </div>
              </Card>

              <Card className="p-6 bg-slate-900 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-orange-500">info</span>
                  <h3 className="text-lg font-black tracking-tight">System Info</h3>
                </div>
                <p className="text-slate-400 text-xs font-bold leading-relaxed mb-4">
                  Reports must be verified by a senior technician before they are visible to doctors and patients.
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Version</span>
                  <span className="text-[10px] font-black uppercase text-white tracking-widest">v2.1-stable</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
};

export default LabDashboardPage;
