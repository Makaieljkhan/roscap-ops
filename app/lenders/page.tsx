import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Lender } from '@/types';
import { LENDER_STATUS_LABELS, LENDER_STATUS_COLORS } from '@/types';

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
  revalidatePath('/lenders');
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lenders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lenders.length} lender{lenders.length !== 1 ? 's' : ''} in database
          </p>
        </div>
        <Link
          href="/lenders/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Add Lender
        </Link>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-6">
          {fetchError}
        </div>
      )}

      {!fetchError && lenders.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm mb-4">No lenders yet.</p>
          <Link
            href="/lenders/new"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Add your first lender
          </Link>
        </div>
      )}

      {lenders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Lender</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Asset Classes</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Deal Size</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">LTV</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Rate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Geography</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lenders.map((lender) => (
                <tr key={lender.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{lender.lender_name}</p>
                    {lender.common_name && lender.common_name !== lender.lender_name && (
                      <p className="text-xs text-gray-400 mt-0.5">{lender.common_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lender.current_status ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LENDER_STATUS_COLORS[lender.current_status]}`}>
                        {LENDER_STATUS_LABELS[lender.current_status]}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {lender.asset_class_appetite.slice(0, 3).map((a) => (
                        <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {a}
                        </span>
                      ))}
                      {lender.asset_class_appetite.length > 3 && (
                        <span className="text-xs text-gray-400">+{lender.asset_class_appetite.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {lender.deal_size_min != null || lender.deal_size_max != null ? (
                      <>
                        {lender.deal_size_min != null ? formatMoney(lender.deal_size_min) : '—'}
                        {' – '}
                        {lender.deal_size_max != null ? formatMoney(lender.deal_size_max) : '—'}
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {lender.ltv_standard != null ? (
                      <>
                        {lender.ltv_standard}%
                        {lender.ltv_stretch != null && (
                          <span className="text-gray-400 text-xs"> / {lender.ltv_stretch}%</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {lender.rate_range_low != null || lender.rate_range_high != null ? (
                      <>
                        {lender.rate_range_low ?? '—'}–{lender.rate_range_high ?? '—'}%
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                    {lender.geography ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/lenders/${lender.id}/edit`}
                        className="text-xs text-gray-500 hover:text-gray-900 hover:underline underline-offset-2"
                      >
                        Edit
                      </Link>
                      <form action={deleteLender}>
                        <input type="hidden" name="id" value={lender.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-400 hover:text-red-600"
                          onClick={(e) => {
                            if (!confirm(`Delete "${lender.lender_name}"?`)) e.preventDefault();
                          }}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}
