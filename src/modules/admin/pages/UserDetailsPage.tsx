'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import UserForm from '@/components/admin/UserForm';
import { userService } from '@/services/userService';
import { UserFullProfileDTO } from '@/types/api';

interface UserDetailsPageProps {
  id: string;
}

export const UserDetailsPage = ({ id }: UserDetailsPageProps) => {
  const [userData, setUserData] = useState<UserFullProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await userService.getFullProfile(id);
        if (res.success && res.data) {
          setUserData(res.data);
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
};
