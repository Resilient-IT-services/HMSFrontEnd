import { PatientRegistration } from '@/modules/reception/pages/PatientRegistration';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientRegistration patientId={id} />;
}
