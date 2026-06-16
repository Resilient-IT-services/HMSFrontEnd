'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Card } from '@/components/ui/Card';
import { labApi, HospitalLabDashboardStatsDTO } from '@/modules/lab/api/labApi';
import { MetricCard } from '@/components/ui/MetricCard';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const HospitalAdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<HospitalLabDashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await labApi.getDashboardStats();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
        triggerGlobalToast('Failed to load laboratory statistics', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.currentHospitalId]);

  return (
    <MainLayout title="Laboratory Operations Dashboard">
      <PageSurface>
        <div className="space-y-6 py-4">
          <PageHeading
            title="Laboratory Operations"
            description="Overview of your hospital's laboratory performance and pending actions."
          />

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MetricCard 
                label="Laboratory Operations Overview"
                layout="chart"
                chartData={{
                  pending: stats?.todayPendingOrders || 0,
                  processing: stats?.todayProcessingOrders || 0,
                  completed: stats?.todayVerifiedReports || 0
                }}
                subValue={`Total Actions: ${(stats?.todayPendingOrders || 0) + (stats?.todayProcessingOrders || 0) + (stats?.todayVerifiedReports || 0)}`}
              />
              
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Tests (Keep as count card but maybe use MetricCard) */}
                <MetricCard 
                  label="Active Local Tests"
                  value={stats?.activeLocalTests || 0}
                  icon="science"
                  variant="blue"
                  subValue="Manage in settings"
                  onClick={() => router.push('/admin/lab-settings')}
                />

                <Card className="p-6 border-slate-100 flex flex-col justify-center items-center text-center">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Reports Status</p>
                  <p className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                    {stats?.todayVerifiedReports || 0} Verified Today
                  </p>
                </Card>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card className="p-6">
               <h3 className="text-lg font-black text-slate-800 mb-4">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-4">
                  <Link href="/admin/lab-settings" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-colors">
                     <span className="material-symbols-outlined text-primary text-2xl">settings</span>
                     <span className="font-bold text-slate-700">Test Settings & Pricing</span>
                  </Link>
               </div>
            </Card>
          </div>

        </div>
      </PageSurface>
    </MainLayout>
  );
};

export default HospitalAdminDashboard;
