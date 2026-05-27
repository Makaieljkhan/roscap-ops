import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import LenderCommentsTable from '@/components/LenderCommentsTable';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import type { Lender } from '@/types';

export const dynamic = 'force-dynamic';

async function getLenders(): Promise<Lender[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('lenders')
    .select('*')
    .order('lender_name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function deleteLender(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const supabase = createServerSupabaseClient();
  await supabase.from('lenders').delete().eq('id', id);
  revalidatePath('/dashboard/lenders');
}

export default async function LendersPage() {
  let lenders: Lender[] = [];
  let fetchError: string | null = null;

  try {
    lenders = await getLenders();
  } catch (err: unknown) {
    fetchError = err instanceof Error ? err.message : 'Failed to load lenders';
  }

  return (
    <div>
      <PageHeader
        title="Lender Intelligence"
        subtitle={`${lenders.length} lender${lenders.length !== 1 ? 's' : ''} in database`}
        action={
          <Link
            href="/dashboard/lenders/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0d2b1f] text-white hover:bg-[#1a4030] shadow-sm transition-all"
          >
            + Add Lender
          </Link>
        }
      />

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-6">
          {fetchError}
        </div>
      )}

      {!fetchError && lenders.length === 0 && (
        <Card className="border-dashed text-center">
          <EmptyState
            icon="◈"
            title="No lenders yet"
            description="Add your first lender to start building the intelligence database."
          />
          <Link
            href="/dashboard/lenders/new"
            className="inline-flex mt-6 items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0d2b1f] text-white hover:bg-[#1a4030] transition-all"
          >
            Add your first lender
          </Link>
        </Card>
      )}

      {lenders.length > 0 && (
        <Card className="p-0 overflow-hidden" hover>
          <LenderCommentsTable lenders={lenders} deleteAction={deleteLender} />
        </Card>
      )}
    </div>
  );
}
