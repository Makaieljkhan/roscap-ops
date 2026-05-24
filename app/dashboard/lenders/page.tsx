import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import DeleteLenderButton from '@/components/DeleteLenderButton';
import LenderScoreCell from '@/components/LenderScoreCell';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import type { Lender } from '@/types';
import { LENDER_STATUS_LABELS, LENDER_STATUS_COLORS } from '@/types';

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Lender</th>
                  <th>Status</th>
                  <th>Asset Classes</th>
                  <th>Deal Size</th>
                  <th>LTV</th>
                  <th>Rate</th>
                  <th>Geography</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lenders.map((lender) => (
                  <tr key={lender.id}>
                    <td>
                      <LenderScoreCell lender={lender} />
                    </td>
                    <td>
                      <p className="font-medium text-[#0d2b1f]">{lender.lender_name}</p>
                      {lender.common_name && lender.common_name !== lender.lender_name && (
                        <p className="text-xs text-[#7a9080] mt-0.5">{lender.common_name}</p>
                      )}
                    </td>
                    <td>
                      {lender.current_status ? (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LENDER_STATUS_COLORS[lender.current_status]}`}
                        >
                          {LENDER_STATUS_LABELS[lender.current_status]}
                        </span>
                      ) : (
                        <span className="text-xs text-[#aaa]">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {lender.asset_class_appetite.slice(0, 3).map((a) => (
                          <span
                            key={a}
                            className="text-xs bg-[#f5f0e8] text-[#3d5a4a] border border-[#ddd6c8] px-2 py-0.5 rounded-full whitespace-nowrap"
                          >
                            {a}
                          </span>
                        ))}
                        {lender.asset_class_appetite.length > 3 && (
                          <span className="text-xs text-[#7a9080]">
                            +{lender.asset_class_appetite.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-[#3d5a4a] whitespace-nowrap">
                      {lender.deal_size_min != null || lender.deal_size_max != null ? (
                        <>
                          {lender.deal_size_min != null ? formatMoney(lender.deal_size_min) : '—'}
                          {' – '}
                          {lender.deal_size_max != null ? formatMoney(lender.deal_size_max) : '—'}
                        </>
                      ) : (
                        <span className="text-[#aaa]">—</span>
                      )}
                    </td>
                    <td className="text-[#3d5a4a] whitespace-nowrap">
                      {lender.ltv_standard != null ? (
                        <>
                          {lender.ltv_standard}%
                          {lender.ltv_stretch != null && (
                            <span className="text-[#7a9080] text-xs"> / {lender.ltv_stretch}%</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[#aaa]">—</span>
                      )}
                    </td>
                    <td className="text-[#3d5a4a] whitespace-nowrap">
                      {lender.rate_range_low != null || lender.rate_range_high != null ? (
                        <>
                          {lender.rate_range_low ?? '—'}–{lender.rate_range_high ?? '—'}%
                        </>
                      ) : (
                        <span className="text-[#aaa]">—</span>
                      )}
                    </td>
                    <td className="text-[#3d5a4a] max-w-[140px] truncate">
                      {lender.geography ?? <span className="text-[#aaa]">—</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/dashboard/lenders/${lender.id}/edit`}
                          className="text-xs text-[#7a9080] hover:text-[#0d2b1f] transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteLenderButton
                          lenderId={lender.id}
                          lenderName={lender.lender_name}
                          deleteAction={deleteLender}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}
