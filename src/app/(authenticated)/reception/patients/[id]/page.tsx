import { PatientProfile } from '@/modules/reception/pages/PatientProfile';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientProfile id={id} />;
}
