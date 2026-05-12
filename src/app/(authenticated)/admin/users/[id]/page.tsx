import { use } from 'react';
import { UserDetailsPage } from '@/modules/admin/pages/UserDetailsPage';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <UserDetailsPage id={id} />;
}
