'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { adminService } from '@/services/adminService';
import { AdminDashboardSummary } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useHospitals } from '@/modules/super_admin/hooks/useHospitals';
import { triggerToast } from '@/utils/toast';
import {
  Activity,
  Building,
  Users,
  UserCheck,
  Award,
  IndianRupee,
  PlusSquare,
  UserRound,
  TrendingUp,
  Search,
  UserPlus,
  Plus,
  Eye,
  Edit3,
  MoreVertical,
  Download
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

export const AdminDashboard = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    hospitals,
    selectedHospital,
    isModalOpen,
    setIsModalOpen,
    handleViewDetails,
    searchTerm,
    setSearchTerm
  } = useHospitals();

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboardSummary();
        if (res.success) {
          setSummary(res.data!);
        }
      } catch (error) {
        console.error('Admin Dashboard Summary Fetch Error:', error);
        triggerToast('Failed to load dashboard metrics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f9f9ff]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6b2b]"></div>
      </div>
    );
  }

  const kpis = summary?.kpis;

  return (
    <MainLayout title="Admin Overview">
      <div className="p-4 md:p-8 bg-[#f9f9ff] min-h-screen font-inter">
        {/* WELCOME SECTION & QUICK ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Welcome back, {user?.fullName || 'Super Admin'}!</h1>
            <p className="text-sm text-slate-500 mt-0.5">Here's what's happening across the platform today.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => router.push('/super_admin/hospitals/create')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold rounded-lg hover:bg-blue-100 transition-all"
            >
              <PlusSquare className="w-3.5 h-3.5" /> Onboard Hospital
            </button>
            <button 
              onClick={() => router.push('/admin/users/create')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" /> Hire User
            </button>
            <button 
              onClick={() => router.push('/admin/laboratory-tests')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-all"
            >
              <Activity className="w-3.5 h-3.5" /> Add Lab Test
            </button>
            <button 
              onClick={() => router.push('/admin/medicines')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-100 text-xs font-bold rounded-lg hover:bg-purple-100 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Medicine
            </button>
            <button 
              onClick={() => router.push('/admin/medicines')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold rounded-lg hover:bg-orange-100 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Import Medicine
            </button>
          </div>
        </div>

        {/* KPI Grid (8 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <KpiCard icon={<Building />} title="Total Hospitals" value={kpis?.totalHospitals || 0} trend="12%" color="blue" />
          <KpiCard icon={<Users />} title="Platform Users" value={kpis?.totalUsers || 0} trend="8.4%" color="purple" />
          <KpiCard icon={<UserCheck />} title="Operational" value={kpis?.operationalUsers || 0} trend="5.7%" color="green" isActiveIndicator />
          <KpiCard icon={<Award />} title="Doctors" value={kpis?.totalDoctors || 0} trend="9.3%" color="orange" />
          <KpiCard icon={<IndianRupee />} title="Revenue" value={`₹${((kpis?.totalRevenue || 0) / 100_000).toFixed(1)}L`} trend="15%" color="indigo" />
          <KpiCard icon={<PlusSquare />} title="New Hosp." value={`+${kpis?.newHospitalsThisMonth || 0}`} trend="33%" color="pink" />
          <KpiCard icon={<UserRound />} title="Patients" value={kpis?.totalPatients || 0} trend="11%" color="emerald" />
        </div>

        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Top Performing Hospitals */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Top Performing Hospitals</h4>
              <button
                onClick={() => router.push('/super_admin/hospitals')}
                className="text-[#ff6b2b] text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-6">
              {summary?.topHospitals.map((h, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-300 w-4 text-center">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700">{h.name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{h.patientCount} Patients</span>
                    </div>
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                      <div className="bg-[#ff6b2b] h-full rounded-full transition-all duration-1000" style={{ width: `${h.performancePercentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent User Registrations */}
          <div className="col-span-12 lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider">Users</h4>
              <button
                onClick={() => router.push('/admin/users')}
                className="text-[#ff6b2b] text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-5">
              {summary?.recentRegistrations.map((u, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-transform group-hover:scale-110 ${getUserBgColor(u.role)}`}>
                      {u.initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{u.fullName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{u.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase">{u.timeAgo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hospital Management Table Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-wider">Facility Master Control</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage all nodes in the hospital network</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-100 w-64"
                  placeholder="Search network node..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border border-solid border-slate-300 border-collapse text-sm">
              <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                <tr className="hover:bg-slate-50 transition-colors">
                  <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Hospital Name & ID</th>
                  <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">City</th>
                  <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Status</th>
                  <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Tier</th>
                  <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Control</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50">
                {hospitals.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300">
                      <div className="flex items-center justify-center text-center">
                        <div>
                          <p className="font-black text-slate-700">{h.name}</p>
                          <p className="text-[10px] font-black text-slate-300 tracking-tighter uppercase">ID: {h.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">{h.city || 'N/A'}</div></td>
                    <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                      <span className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        {h.status === 'ACTIVE' ? 'Operational' : h.status}
                      </span>
                    </div></td>
                    <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">STANDARD</span>
                    </div></td>
                    <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleViewDetails(h)} className="p-2 text-slate-400 hover:text-[#ff6b2b] hover:bg-orange-50 rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => router.push(`/super_admin/hospitals/${h.id}`)} className="p-2 text-slate-400 hover:text-[#ff6b2b] hover:bg-orange-50 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Existing Hospital Details Modal Re-integrated */}
      {isModalOpen && selectedHospital && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Facility Master Profile"
          size="xl"
        >
          {/* Existing Modal Content Kept for Functionality */}
          <div className="grid grid-cols-1 lg:grid-cols-12 font-inter text-slate-900 bg-white">
            <div className="lg:col-span-5 bg-slate-50 p-8 border-r border-slate-200">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-[#ff6b2b] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ff6b2b]">Network Node</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">{selectedHospital.name}</h3>
                <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-wide">ID: {selectedHospital.code}</p>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-sm font-black text-emerald-600 uppercase">{selectedHospital.status}</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 p-8 bg-white max-h-[80vh] overflow-y-auto">
              {/* Detailed info ... */}
              <div className="space-y-8">
                 <div>
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="h-1 w-4 bg-[#ff6b2b] rounded-full" />
                      Physical Infrastructure
                    </h4>
                    <div className="bg-orange-50/50 p-5 rounded-3xl border border-orange-100/50">
                      <p className="text-sm font-bold text-slate-800 italic mb-4">{selectedHospital.address || 'N/A'}</p>
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-orange-200/30">
                        <div><p className="text-[9px] font-black text-[#ff6b2b] uppercase mb-1">City</p><p className="text-sm font-black">{selectedHospital.city || 'N/A'}</p></div>
                        <div><p className="text-[9px] font-black text-[#ff6b2b] uppercase mb-1">State</p><p className="text-sm font-black">{selectedHospital.state || 'N/A'}</p></div>
                        <div><p className="text-[9px] font-black text-[#ff6b2b] uppercase mb-1">Pincode</p><p className="text-sm font-black">{selectedHospital.pincode || 'N/A'}</p></div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
};

// Helper Components
function KpiCard({ icon, title, value, trend, color, subText, isActiveIndicator }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-amber-50 text-amber-500',
    pink: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-indigo-50 text-indigo-500',
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-snug break-words">{title}</p>
        <span className={`p-1.5 rounded-lg ${colors[color]}`}>
          {React.cloneElement(icon, { className: 'w-4 h-4' })}
        </span>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
          {isActiveIndicator && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>}
        </div>
        {trend && (
          <p className="text-[10px] text-emerald-500 font-bold flex items-center mt-1">
            <TrendingUp className="w-3 h-3 mr-1" /> {trend}
          </p>
        )}
        {subText && <p className="text-[10px] font-medium text-slate-400 mt-1">{subText}</p>}
      </div>
    </div>
  );
}

function getUserBgColor(role: string) {
  if (role === 'Doctor') return 'bg-orange-100 text-[#ff6b2b]';
  if (role === 'Pharmacist') return 'bg-emerald-100 text-emerald-600';
  if (role === 'Hospital Admin') return 'bg-blue-100 text-blue-600';
  return 'bg-indigo-100 text-indigo-600';
}
