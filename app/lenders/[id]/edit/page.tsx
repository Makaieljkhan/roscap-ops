import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import LenderForm from '@/components/LenderForm';
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
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-semibold text-[#1B3A35]">Edit Lender</h1>
        <p className="text-gray-500 mt-1 text-sm">{lender.lender_name}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <LenderForm mode="edit" lender={lender} />
      </div>
    </div>
  );
}
