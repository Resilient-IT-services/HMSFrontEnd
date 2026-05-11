'use client';

import { useParams } from 'next/navigation';
import BatchDetailPage from '@/modules/pharmacy/pages/BatchDetailPage';

export default function Page() {
  const { id } = useParams();
  return <BatchDetailPage id={id as string} />;
}
