'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { Role, UserSummaryDTO } from '@/types/api';
import { useAdminUsers } from '@/modules/admin/hooks/useAdminUsers';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';

export default function UserManagement() {
  const router = useRouter();
  const {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalElements,
    roleFilter,
    setRoleFilter,
    refresh
  } = useAdminUsers();

  const columns: Column<UserSummaryDTO & { roles: Role[] }>[] = [
    {
      header: 'User Details',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 font-black uppercase border-2 border-white shadow-sm">
            {user.fullName ? user.fullName.slice(0, 2) : user.username.slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">{user.fullName || user.username}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Roles',
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles && user.roles.length > 0 ? (
            user.roles.slice(0, 2).map((role, idx) => (
              <Badge key={idx} variant="orange" size="sm">{role}</Badge>
            ))
          ) : (
            <span className="text-[10px] text-slate-400 italic">No Roles Assigned</span>
          )}
          {user.roles && user.roles.length > 2 && (
            <Badge variant="slate" size="sm">+{user.roles.length - 2}</Badge>
          )}
        </div>
      )
    },
    {
      header: 'Hospital Context',
      render: (user) => {
        const primaryMembership = user.memberships?.[0];
        const membershipCount = user.memberships?.length ?? 0;
        const primaryHospitalName = primaryMembership?.hospitalName || 'N/A';
        const departmentName = primaryMembership?.roleAssignments?.[0]?.departmentName || 'General';
        
        return (
          <div>
            <p className="text-xs text-slate-700 font-bold">{primaryHospitalName}{membershipCount > 1 ? ` (+${membershipCount - 1})` : ''}</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{departmentName}</p>
          </div>
        );
      }
    },
    {
      header: 'Status',
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}></div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${user.active ? 'text-emerald-700' : 'text-slate-400'}`}>
            {user.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (user) => (
        <Button 
          variant="secondary" 
          size="sm" 
          icon="edit" 
          onClick={() => router.push(`/admin/users/${user.id}`)}
          title="Edit Permissions"
        />
      )
    }
  ];

  return (
    <MainLayout title="Identity & Access" hideTitle>
      <div className="p-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f8f9fb] min-h-screen font-inter">
        
        <PageHeading 
          title="Identity & Access" 
          description="Manage hospital staff credentials, institutional memberships, and role-based access controls."
        >
          <Button icon="person_add" size="lg" href="/admin/users/create">
            Provision New User
          </Button>
        </PageHeading>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
          {/* Toolbar */}
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-full max-w-xl">
                <SearchInput 
                  placeholder="Search staff by name, email, or username..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                value={roleFilter || ''}
                onChange={(e) => setRoleFilter(e.target.value || undefined)}
                className="px-4 py-3 bg-white border-none rounded-xl text-slate-700 font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors cursor-pointer outline-none min-w-[180px]"
              >
                <option value="">All Functional Roles</option>
                <option value="ADMIN">Administrator</option>
                <option value="DOCTOR">Medical Doctor</option>
                <option value="NURSE">Nursing Staff</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="PHARMACIST">Pharmacist</option>
              </select>
            </div>
            <Button variant="secondary" icon="refresh" isLoading={loading} onClick={() => refresh()} />
          </div>

          <Table 
            columns={columns} 
            data={users} 
            isLoading={loading}
            onRowDoubleClick={(user) => router.push(`/admin/users/${user.id}`)}
            emptyMessage="No staff members found matching your security criteria."
          />

          <Pagination 
            page={page} 
            totalElements={totalElements} 
            pageSize={20}
            onPageChange={setPage} 
            label="staff members"
          />
        </div>

        {/* Global Stats/Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
           <div className="bg-slate-900 p-8 rounded-2xl text-white flex flex-col justify-between relative overflow-hidden shadow-xl shadow-slate-900/10">
              <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Total Provisioned</h4>
                <p className="text-4xl font-black">{totalElements}</p>
              </div>
              <div className="relative z-10 mt-8">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  System Fully Operational
                </p>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl text-white/5 rotate-12">shield_person</span>
           </div>
           
           <div className="md:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="font-manrope text-xl font-black text-slate-900 mb-2 tracking-tight">Access Control Audit</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">
                  All user modifications are logged for compliance. Periodic review of privileged accounts (Admin/Super Admin) is recommended every 90 days.
                </p>
              </div>
              <Button variant="secondary" icon="history">Security Log</Button>
           </div>
        </div>
      </div>
    </MainLayout>
  );
}
