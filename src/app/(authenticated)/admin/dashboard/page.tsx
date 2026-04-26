'use client';

import React, { useEffect, useState, useMemo } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { userService } from '@/services/userService';
import { hospitalService } from '@/services/hospitalService';
import { UserResponse, HospitalResponse } from '@/types/api';
import { useRouter } from 'next/navigation';

const AdminDashboard = () => {
  const router = useRouter();
  const [users, setUsers] = useState<UserResponse[]>([]);
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
    const activeNow = users.filter(u => u.active).length; // Mocking "Active Now" as active users
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

  return (
    <MainLayout title="Admin Overview" hideTitle>
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f7f9fb] min-h-screen font-inter">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-manrope text-3xl font-bold text-slate-900">Admin Overview</h1>
            <p className="text-slate-500 mt-1">Real-time health indicators and administrative network status.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              Last 30 Days
            </button>
            <button 
              onClick={() => router.push('/super_admin/hospitals')}
              className="px-4 py-2 bg-orange-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Onboard Hospital
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Hospitals', value: stats.totalHospitals, icon: 'apartment', color: 'text-orange-700', bg: 'bg-orange-50', trend: '+12%' },
            { label: 'Platform Users', value: stats.platformUsers, icon: 'group', color: 'text-blue-600', bg: 'bg-blue-50', trend: '+5.4%' },
            { label: 'Active Now', value: stats.activeNow, icon: 'bolt', color: 'text-emerald-600', bg: 'bg-emerald-50', pulse: true },
            { label: 'Certified Doctors', value: stats.certifiedDoctors, icon: 'medical_services', color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Stable' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
                </div>
                {stat.pulse ? (
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                ) : (
                  <span className={`flex items-center ${stat.trend === 'Stable' ? 'text-slate-400 bg-slate-50' : 'text-emerald-600 bg-emerald-50'} text-xs font-bold px-2 py-1 rounded`}>
                    {stat.trend !== 'Stable' && <span className="material-symbols-outlined text-xs mr-1">trending_up</span>}
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Bento Layout Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Table Area */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 font-manrope">Network Activity</h2>
              <button onClick={() => router.push('/super_admin/hospitals')} className="text-orange-700 text-sm font-bold hover:underline">View All Records</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Hospital Entity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Daily Users</th>
                    <th className="px-6 py-4 text-right">Last Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hospitals.slice(0, 5).map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex-shrink-0 flex items-center justify-center text-orange-700 font-bold uppercase">
                            {h.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{h.name}</p>
                            <p className="text-xs text-slate-400">{h.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${h.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {h.status === 'ACTIVE' ? 'Fully Integrated' : h.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-slate-700">85%</p>
                          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[85%]"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-slate-400 text-xs">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {hospitals.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No hospital activity records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Actions & Metrics */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 font-manrope mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'New Branch', icon: 'add_business', href: '/super_admin/hospitals' },
                  { label: 'Hire Admin', icon: 'person_add', href: '/admin/users/create' },
                  { label: 'Audit Logs', icon: 'analytics', href: '#' },
                  { label: 'Backups', icon: 'cloud_download', href: '#' }
                ].map((act, i) => (
                  <button 
                    key={i} 
                    onClick={() => act.href !== '#' && router.push(act.href)}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-orange-700/30 hover:bg-orange-50 transition-all group"
                  >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-orange-700 mb-2">{act.icon}</span>
                    <span className="text-xs font-bold text-slate-600">{act.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* System Health Card */}
            <div className="bg-orange-700 p-6 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
              <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-manrope leading-none">System Integrity</h3>
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1 opacity-90 uppercase tracking-widest">Server Load</div>
                    <div className="h-1.5 bg-white/20 rounded-full">
                      <div className="h-full bg-white rounded-full w-[42%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1 opacity-90 uppercase tracking-widest">DB Latency</div>
                    <div className="h-1.5 bg-white/20 rounded-full">
                      <div className="h-full bg-white rounded-full w-[12%]"></div>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-[11px] leading-relaxed opacity-80">All clusters are performing within optimal parameters. No outages reported in the last 72 hours.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer/Compliance Note */}
        <footer className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          <p>© 2024 MedCore HMS. All medical records encrypted via AES-256-GCM.</p>
          <div className="flex gap-6">
            <a className="hover:text-orange-700 transition-colors" href="#">Compliance</a>
            <a className="hover:text-orange-700 transition-colors" href="#">Privacy</a>
            <a className="hover:text-orange-700 transition-colors" href="#">Security</a>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
