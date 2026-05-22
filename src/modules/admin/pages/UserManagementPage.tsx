'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { Role, UserSummaryDTO, UserRequestDTO } from '@/types/api';
import { useAdminUsers } from '@/modules/admin/hooks/useAdminUsers';
import { userService } from '@/services/userService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { PageSurface } from '@/components/ui/PageSurface';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { getDepartmentLabel } from '@/utils/staffDisplay';

export const UserManagementPage = () => {
  const router = useRouter();
  const {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    roleFilter,
    setRoleFilter,
    activeFilter,
    setActiveFilter,
    refresh
  } = useAdminUsers();

  const columns: Column<UserSummaryDTO & { roles: Role[] }>[] = [
    {
      header: 'User Details',
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName || user.username} />
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">{user.fullName || user.username}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-tighter text-slate-400">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Roles',
      render: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles && user.roles.length > 0 ? (
            user.roles.slice(0, 2).map((role, index) => (
              <Badge key={index} variant="orange" size="sm">{role}</Badge>
            ))
          ) : (
            <span className="text-[10px] italic text-slate-400">No Roles Assigned</span>
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
        const departmentName = getDepartmentLabel(primaryMembership?.roleAssignments?.[0], 'General');

        return (
          <div>
            <p className="text-xs font-bold text-slate-700">{primaryHospitalName}{membershipCount > 1 ? ` (+${membershipCount - 1})` : ''}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{departmentName}</p>
          </div>
        );
      }
    },
    {
      header: 'Status',
      render: (user) => {
        const currentStatus = user.status || (user.active ? 'ACTIVE' : 'INACTIVE');

        return (
          <StatusIndicator
            status={currentStatus}
            variant={currentStatus === 'ACTIVE' ? 'emerald' : 'red'}
            title={currentStatus === 'ACTIVE' ? 'Click to Deactivate' : 'Click to Activate'}
            onClick={async (e) => {
              e.stopPropagation();

              try {
                const res = await userService.getFullProfile(user.id);

                if (res.success && res.data) {
                  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                  const fullProfile = res.data;

                  const userPayload: UserRequestDTO = {
                    id: fullProfile.id,
                    username: fullProfile.username,
                    email: fullProfile.email,
                    fullName: fullProfile.fullName,
                    gender: fullProfile.gender,
                    dob: fullProfile.dob,
                    phone: fullProfile.phone,
                    superuser: fullProfile.superuser,
                    status: newStatus as any,
                    active: newStatus === 'ACTIVE',
                    memberships: fullProfile.memberships,
                    doctorInfo: fullProfile.doctorInfo,
                    nurseInfo: fullProfile.nurseInfo,
                    pharmacistInfo: fullProfile.pharmacistInfo,
                    receptionistInfo: fullProfile.receptionistInfo
                  };

                  const updateRes = await userService.updateUser(user.id, userPayload);
                  if (updateRes.success) {
                    triggerGlobalToast(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`, 'success');
                    refresh();
                  }
                }
              } catch (error) {
                console.error('Failed to toggle status', error);
              }
            }}
          />
        );
      }
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
    <MainLayout title=" Identity & Access">
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PageHeading
            title="Identity & Access"
            description="Manage hospital staff credentials, institutional memberships, and role-based access controls."
          >
            <Button icon="person_add" size="lg" href="/admin/users/create">
              Create User
            </Button>
          </PageHeading>

          <ContentPanel
            className="mb-12"
            toolbar={(
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-4">
                  <div className="w-full max-w-xl">
                    <SearchInput
                      placeholder="Search by name, email..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                  <select
                    value={roleFilter || ''}
                    onChange={(event) => setRoleFilter(event.target.value || undefined)}
                    className="min-w-[180px] cursor-pointer rounded-xl border-none bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-50"
                  >
                    <option value="">All Functional Roles</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="DOCTOR">Medical Doctor</option>
                    <option value="NURSE">Nursing Staff</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="PHARMACIST">Pharmacist</option>
                  </select>
                  <select
                    value={activeFilter === undefined ? '' : String(activeFilter)}
                    onChange={(event) => {
                      const value = event.target.value;
                      setActiveFilter(value === '' ? undefined : value === 'true');
                    }}
                    className="min-w-[150px] cursor-pointer rounded-xl border-none bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-50"
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <Button variant="secondary" icon="refresh" isLoading={loading} onClick={() => refresh()} />
              </div>
            )}
          >
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
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              label="staff members"
            />
          </ContentPanel>

          <div className="grid grid-cols-1 gap-6 pb-12 md:grid-cols-3">
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
