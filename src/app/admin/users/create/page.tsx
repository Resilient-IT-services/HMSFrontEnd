'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import UserForm from '@/components/admin/UserForm';

export default function CreateUserPage() {
  return (
    <MainLayout title="Create User">
      <UserForm />
    </MainLayout>
  );
}
