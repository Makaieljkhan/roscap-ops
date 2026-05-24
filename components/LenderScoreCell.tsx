'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Lender } from '@/types';

function scoreBadgeClass(score: number) {
  if (score >= 7) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 5) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-600 border-red-200';
}

export default function LenderScoreCell({ lender }: { lender: Lender }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const score = lender.ai_score_override ?? lender.ai_score;

  async function handleRate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch('/api/lenders/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lenderId: lender.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rating failed');
    } finally {
      setLoading(false);
    }
  }

  if (score != null) {
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-xs font-semibold border ${scoreBadgeClass(score)}`}
        title={lender.ai_score_rationale ?? undefined}
      >
        {score.toFixed(1)}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRate}
      disabled={loading}
      className="text-xs font-medium text-[#c9a84c] hover:text-[#0d2b1f] border border-[#c9a84c]/40 hover:border-[#c9a84c] rounded-full px-2.5 py-0.5 transition-colors disabled:opacity-50"
    >
      {loading ? '…' : 'Rate'}
    </button>
  );
}
