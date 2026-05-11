'use client';

import { useParams } from 'next/navigation';
import PrescriptionDetailPage from '@/modules/pharmacy/pages/PrescriptionDetailPage';

export default function Page() {
  const { id } = useParams();
  return <PrescriptionDetailPage id={id as string} />;
}
