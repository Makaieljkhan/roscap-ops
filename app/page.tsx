import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function Home() {
  const session = cookies().get('roscap_session');
  if (session) redirect('/dashboard/lenders');
  redirect('/login');
}
