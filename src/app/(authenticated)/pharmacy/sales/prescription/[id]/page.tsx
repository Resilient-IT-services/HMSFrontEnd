'use client';

import { useParams } from 'next/navigation';
import PharmacySaleDetailPage from '@/modules/pharmacy/pages/PharmacySaleDetailPage';

export default function Page() {
  const { id } = useParams();
  return <PharmacySaleDetailPage prescriptionId={id as string} />;
}
