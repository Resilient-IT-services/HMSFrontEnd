'use client';

import React, { useEffect, useState, use } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import UserForm from '@/components/admin/UserForm';
import apiClient from '@/services/apiClient';
import { ApiResponse, UserFullProfileDTO } from '@/types/api';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [userData, setUserData] = useState<UserFullProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<ApiResponse<UserFullProfileDTO>>(`/users/${id}`);
        if (res.data.success && res.data.data) {
          setUserData(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <MainLayout title="Loading User...">
        <div className="flex items-center justify-center h-64 text-gray-500">
          Loading user details...
        </div>
      </MainLayout>
    );
  }

  if (!userData) {
    return (
      <MainLayout title="User Not Found">
        <div className="flex items-center justify-center h-64 text-red-500">
          User not found.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Edit ${userData.fullName || userData.username}`}>
      <UserForm initialData={userData} isEdit />
    </MainLayout>
  );
}
