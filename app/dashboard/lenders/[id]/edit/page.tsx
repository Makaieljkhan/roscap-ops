import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import LenderForm from '@/components/LenderForm';
import LenderRatingPanel from '@/components/LenderRatingPanel';
import { PageHeader } from '@/components/ui';
import type { Lender } from '@/types';

interface Props {
  params: { id: string };
}

export async function generateMetadata() {
  return { title: `Edit Lender — Roscap` };
}

async function getLender(id: string): Promise<Lender | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('lenders')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export default async function EditLenderPage({ params }: Props) {
  const lender = await getLender(params.id);

  if (!lender) notFound();

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Edit Lender" subtitle={lender.lender_name} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
        <LenderForm mode="edit" lender={lender} />
        <LenderRatingPanel lender={lender} />
      </div>
    </div>
  );
}
