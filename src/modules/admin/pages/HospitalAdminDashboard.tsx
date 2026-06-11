'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Card } from '@/components/ui/Card';
import { labApi, HospitalLabDashboardStatsDTO } from '@/modules/lab/api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import Link from 'next/link';

const HospitalAdminDashboard = () => {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Active Tests */}
              <Card className="p-6 border-l-4 border-l-primary flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Tests</p>
                    <h3 className="text-3xl font-black text-slate-800">{stats?.activeLocalTests || 0}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">science</span>
                  </div>
                </div>
                <Link href="/admin/lab-settings" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                  Manage Settings <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </Card>

              {/* Pending Orders */}
              <Card className="p-6 border-l-4 border-l-amber-500 flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Collection</p>
                    <h3 className="text-3xl font-black text-slate-800">{stats?.todayPendingOrders || 0}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-500 text-2xl">pending_actions</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-400">Orders awaiting sample collection today</p>
              </Card>

              {/* Processing Orders */}
              <Card className="p-6 border-l-4 border-l-blue-500 flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">In Processing</p>
                    <h3 className="text-3xl font-black text-slate-800">{stats?.todayProcessingOrders || 0}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-500 text-2xl">microbiology</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-400">Samples currently being analyzed</p>
              </Card>

              {/* Verified Reports */}
              <Card className="p-6 border-l-4 border-l-emerald-500 flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Verified Reports</p>
                    <h3 className="text-3xl font-black text-slate-800">{stats?.todayVerifiedReports || 0}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-500 text-2xl">verified</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-emerald-500 bg-emerald-50 inline-block px-2 py-1 rounded-md mt-auto self-start">
                  Ready for patients
                </p>
              </Card>

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
