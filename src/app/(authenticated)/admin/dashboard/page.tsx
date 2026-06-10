'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Bell,
  HelpCircle,
  UserPlus,
  Plus,
  Building,
  UserCheck,
  Award,
  IndianRupee,
  PlusSquare,
  UserRound,
  BarChart,
  TrendingUp,
  AlertTriangle,
  Server,
  Database,
  ShieldCheck,
  ChevronRight,
  Eye,
  LineChart,
  Edit3,
  MoreVertical,
  Download
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { hospitalService } from '@/services/hospitalService';
import { AdminDashboardSummary, HospitalResponse } from '@/types/api';
import { triggerToast } from '@/utils/toast';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [summaryRes, hospitalsRes] = await Promise.all([
        adminService.getDashboardSummary(),
        hospitalService.list({ size: 5 })
      ]);

      if (summaryRes.success) setSummary(summaryRes.data!);
      if (hospitalsRes.success) setHospitals(hospitalsRes.data!.content);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      triggerToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kpis = summary?.kpis;

  return (
    <div className="p-8">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">ADMIN OVERVIEW</h1>
          <p className="text-text-muted text-sm">Real-time platform overview and management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-custom focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
              placeholder="Search anything..."
              type="text"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-custom text-text-muted hover:bg-gray-50">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white border border-gray-200 rounded-custom text-text-muted hover:bg-gray-50">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 border border-gray-300 rounded-custom font-semibold text-sm flex items-center gap-2 hover:bg-gray-50">
              <UserPlus className="w-4 h-4" />
              Hire User
            </button>
            <button className="px-4 py-2 bg-primary text-white rounded-custom font-semibold text-sm flex items-center gap-2 hover:bg-orange-600 shadow-sm transition-all">
              <Plus className="w-4 h-4" />
              Onboard Hospital
            </button>
          </div>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        <KpiCard icon={<Building />} title="Total Hospitals" value={kpis?.totalHospitals || 0} trend="12%" color="blue" />
        <KpiCard icon={<Users />} title="Platform Users" value={kpis?.totalUsers || 0} trend="8.4%" color="purple" />
        <KpiCard icon={<UserCheck />} title="Operational" value={kpis?.operationalUsers || 0} trend="5.7%" color="green" isActiveIndicator />
        <KpiCard icon={<Award />} title="Doctors" value={kpis?.totalDoctors || 0} trend="9.3%" color="orange" />
        <KpiCard icon={<IndianRupee />} title="Revenue" value={`₹${(kpis?.totalRevenue || 0) / 100_000}L`} trend="15%" color="indigo" />
        <KpiCard icon={<PlusSquare />} title="New Hosp." value={`+${kpis?.newHospitalsThisMonth || 0}`} trend="33%" color="pink" />
        <KpiCard icon={<UserRound />} title="Patients" value={kpis?.totalPatients || 0} trend="11%" color="emerald" />
        <KpiCard icon={<BarChart />} title="Uptime" value={kpis?.systemUptime || '99.9%'} color="violet" subText="Last 30 days" />
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Top Performing */}
        <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-custom border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-sm">Top Performing Hospitals</h4>
            <select className="text-[10px] border-gray-200 rounded p-1">
              <option>This Month</option>
              <option>Last Quarter</option>
            </select>
          </div>
          <div className="space-y-5">
            {summary?.topHospitals.map((h, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-400 w-4 text-center">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold">{h.name}</span>
                    <span className="text-xs text-gray-400">{h.patientCount} Patients</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${h.performancePercentage}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent User Registrations */}
        <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-custom border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-sm">Recent User Registrations</h4>
            <a className="text-primary text-[10px] font-bold" href="#">View All</a>
          </div>
          <div className="space-y-5">
            {summary?.recentRegistrations.map((u, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getUserBgColor(u.role)}`}>
                    {u.initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{u.fullName}</p>
                    <p className="text-[10px] text-gray-400">{u.role}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400">{u.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Alerts and Platform Health */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-custom border border-gray-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm">Recent Alerts</h4>
              <a className="text-primary text-[10px] font-bold" href="#">View All</a>
            </div>
            <div className="space-y-4">
              {summary?.alerts.map((a, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getAlertBgColor(a.type)}`}>
                    {a.type === 'LICENSE' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Server className="w-4 h-4 text-orange-500" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{a.message}</p>
                    <p className="text-[10px] text-gray-400">{a.timeAgo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-custom border border-gray-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm">Platform Health</h4>
              <a className="text-primary text-[10px] font-bold" href="#">View All</a>
            </div>
            <div className="space-y-3">
              <HealthRow icon={<Server />} label="API Server" status={summary?.health.apiStatus || 'Healthy'} />
              <HealthRow icon={<Database />} label="Database" status={summary?.health.dbStatus || 'Healthy'} />
              <HealthRow icon={<ShieldCheck />} label="Auth Service" status={summary?.health.authStatus || 'Healthy'} />
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-3">
                <span className="text-xs font-bold">Overall Uptime</span>
                <span className="text-xs font-bold text-emerald-600">{summary?.health.overallUptime || '99.98%'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-custom border border-gray-100 shadow-sm">
            <h4 className="font-bold text-sm mb-4">Quick Actions</h4>
            <div className="space-y-2">
              <QuickActionButton icon={<PlusSquare className="text-blue-500" />} label="Onboard New Hospital" />
              <QuickActionButton icon={<UserPlus className="text-blue-500" />} label="Add Platform User" />
              <QuickActionButton icon={<IndianRupee className="text-blue-500" />} label="New Subscription Plan" />
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Management Table */}
      <div className="bg-white rounded-custom border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h4 className="font-bold">Hospital Management</h4>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-custom text-xs focus:outline-none w-64"
                placeholder="Search hospital name or ID..."
                type="text"
              />
            </div>
            <select className="text-xs border-gray-200 rounded p-1.5 bg-gray-50">
              <option>All Cities</option>
            </select>
            <select className="text-xs border-gray-200 rounded p-1.5 bg-gray-50">
              <option>All Status</option>
            </select>
            <button className="px-3 py-1.5 border border-gray-200 rounded-custom text-xs font-semibold flex items-center gap-2 hover:bg-gray-50">
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase text-text-muted font-bold">
              <tr>
                <th className="px-6 py-4">Hospital Name & ID</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Subscription Plan</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-gray-50">
              {hospitals.map((h, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                        {h.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{h.name}</p>
                        <p className="text-[10px] text-gray-400">ID: {h.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{h.city || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">Standard</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-primary"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 text-gray-400 hover:text-primary"><LineChart className="w-4 h-4" /></button>
                      <button className="p-1.5 text-gray-400 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-1.5 text-gray-400 hover:text-primary"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, title, value, trend, color, subText, isActiveIndicator }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-500',
    purple: 'bg-purple-50 text-purple-500',
    green: 'bg-green-50 text-green-500',
    orange: 'bg-orange-50 text-orange-500',
    indigo: 'bg-indigo-50 text-indigo-500',
    pink: 'bg-pink-50 text-pink-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    violet: 'bg-violet-50 text-violet-500',
  };

  return (
    <div className="bg-white p-4 rounded-custom border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        {isActiveIndicator && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>}
      </div>
      <p className="text-xs text-text-muted font-medium">{title}</p>
      <h3 className="text-xl font-bold">{value}</h3>
      {trend && (
        <p className="text-[10px] text-green-500 flex items-center mt-1">
          <TrendingUp className="w-3 h-3 mr-1" /> {trend} <span className="text-gray-400 ml-1">vs month</span>
        </p>
      )}
      {subText && <p className="text-[10px] text-gray-400 mt-1">{subText}</p>}
    </div>
  );
}

function HealthRow({ icon, label, status }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {React.cloneElement(icon, { className: 'w-3.5 h-3.5 text-emerald-500' })}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold">{status}</span>
    </div>
  );
}

function QuickActionButton({ icon, label }: any) {
  return (
    <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-orange-50 rounded-custom group transition-colors">
      <div className="flex items-center gap-3">
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-primary" />
    </button>
  );
}

function getUserBgColor(role: string) {
  if (role === 'Doctor') return 'bg-orange-100 text-primary';
  if (role === 'Pharmacist') return 'bg-emerald-100 text-emerald-600';
  if (role === 'Hospital Admin') return 'bg-blue-100 text-blue-600';
  return 'bg-indigo-100 text-indigo-600';
}

function getAlertBgColor(type: string) {
  return type === 'LICENSE' ? 'bg-red-50' : 'bg-orange-50';
}
