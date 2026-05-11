'use client';

import { use } from 'react';
import { EditHospital } from '@/modules/super_admin/pages/EditHospital';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditHospital id={id} />;
}
