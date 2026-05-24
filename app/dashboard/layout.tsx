import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { SidebarNav } from '@/components/SidebarNav';
import { PageContent } from '@/components/PageContent';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('roscap_session')?.value;

  if (!sessionCookie) redirect('/login');

  let session: { userId: string; name: string; role: string };
  try {
    session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
  } catch {
    redirect('/login');
  }

  const supabase = createClient();
  const { data: user } = await supabase
    .from('app_users')
    .select('id, display_name, role')
    .eq('id', session.userId)
    .single();

  if (!user) redirect('/login');

  return (
    <div className="flex h-screen bg-[#f5f0e8] overflow-hidden font-sans">
      <SidebarNav user={{ name: user.display_name, role: user.role }} />
      <main className="flex-1 overflow-y-auto bg-[#f5f0e8]">
        <PageContent>{children}</PageContent>
      </main>
    </div>
  );
}
