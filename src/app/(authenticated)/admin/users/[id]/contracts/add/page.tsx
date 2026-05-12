import { AddContractPage } from '@/modules/admin/pages/AddContractPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddContractPage id={id} />;
}
