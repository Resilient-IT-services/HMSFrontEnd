'use client';

import { LabTestParametersPage } from '@/modules/lab/pages/LabTestParametersPage';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams();
  const testId = params.id as string;
  
  return <LabTestParametersPage testId={testId} />;
}
