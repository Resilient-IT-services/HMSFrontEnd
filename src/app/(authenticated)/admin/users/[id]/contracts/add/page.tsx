'use client';

import { use } from 'react';
import { AddContractPage } from '@/modules/admin/pages/AddContractPage';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AddContractPage id={id} />;
}
