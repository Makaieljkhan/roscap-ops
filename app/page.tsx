'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LenderMatchResponse, LenderMatchResult } from '@/types';
import { LENDER_STATUS_LABELS, LENDER_STATUS_COLORS, COMMON_ASSET_CLASSES } from '@/types';

const DEFAULT_FORM = {
  deal_size: '',
  asset_class: '',
  ltv: '',
  geography: '',
  additional_notes: '',
};

export default function DashboardPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState<LenderMatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMatch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const payload = {
      deal_size: Number(form.deal_size),
      asset_class: form.asset_class,
      ltv: Number(form.ltv),
      geography: form.geography || undefined,
      additional_notes: form.additional_notes || undefined,
    };

    try {
      const res = await fetch('/api/lender-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Matching failed');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lender Match</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Enter deal parameters and let AI identify suitable lenders from the database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div>
          <form onSubmit={handleMatch} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <label className="label">Deal Size ($)</label>
              <input
                type="number"
                required
                min={1}
                className="input"
                placeholder="e.g. 5000000"
                value={form.deal_size}
                onChange={(e) => setForm({ ...form, deal_size: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Asset Class</label>
              <div className="flex gap-2">
                <input
                  required
                  className="input flex-1"
                  placeholder="e.g. Residential, Construction…"
                  list="asset-class-list"
                  value={form.asset_class}
                  onChange={(e) => setForm({ ...form, asset_class: e.target.value })}
                />
                <datalist id="asset-class-list">
                  {COMMON_ASSET_CLASSES.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div>
              <label className="label">LTV (%)</label>
              <input
                type="number"
                required
                min={1}
                max={100}
                step={0.5}
                className="input"
                placeholder="e.g. 65"
                value={form.ltv}
                onChange={(e) => setForm({ ...form, ltv: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Geography</label>
              <input
                className="input"
                placeholder="e.g. NSW, Eastern Seaboard, National"
                value={form.geography}
                onChange={(e) => setForm({ ...form, geography: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Additional Notes</label>
              <textarea
                className="input min-h-[80px] resize-y"
                placeholder="Borrower profile, exit strategy, timing, special circumstances…"
                value={form.additional_notes}
                onChange={(e) => setForm({ ...form, additional_notes: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Analysing…' : 'Find Matching Lenders'}
            </button>
          </form>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/lenders"
              className="flex items-center justify-center bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View All Lenders
            </Link>
            <Link
              href="/lenders/new"
              className="flex items-center justify-center bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Add Lender
            </Link>
          </div>
        </div>

        {/* Results */}
        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Analysing lenders…</p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {result.summary && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                  {result.summary}
                </div>
              )}
              {result.matches.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500 text-center">
                  No suitable lenders found for this deal.
                </div>
              )}
              {result.matches.map((match) => (
                <MatchCard key={match.lender.id} match={match} />
              ))}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
              Match results will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: LenderMatchResult }) {
  const scoreColor =
    match.match_score >= 80
      ? 'bg-green-100 text-green-800'
      : match.match_score >= 60
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-700';

  const { lender } = match;
  const displayName = lender.common_name ?? lender.lender_name;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{displayName}</h3>
          {lender.common_name && lender.common_name !== lender.lender_name && (
            <p className="text-xs text-gray-400 mt-0.5">{lender.lender_name}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {lender.current_status && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LENDER_STATUS_COLORS[lender.current_status]}`}>
                {LENDER_STATUS_LABELS[lender.current_status]}
              </span>
            )}
            {lender.geography && (
              <span className="text-xs text-gray-500">{lender.geography}</span>
            )}
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${scoreColor}`}>
          {match.match_score}% match
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat
          label="LTV"
          value={
            lender.ltv_standard != null
              ? `${lender.ltv_standard}%${lender.ltv_stretch ? ` / ${lender.ltv_stretch}%` : ''}`
              : '—'
          }
        />
        <Stat
          label="Rate"
          value={
            lender.rate_range_low != null || lender.rate_range_high != null
              ? `${lender.rate_range_low ?? '—'}–${lender.rate_range_high ?? '—'}%`
              : '—'
          }
        />
        <Stat
          label="Max Deal"
          value={lender.deal_size_max != null ? formatMoney(lender.deal_size_max) : '—'}
        />
      </div>

      {lender.asset_class_appetite.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lender.asset_class_appetite.map((a) => (
            <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {a}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-700">{match.reasoning}</p>

      {match.caveats.length > 0 && (
        <ul className="space-y-1">
          {match.caveats.map((c, i) => (
            <li key={i} className="text-xs text-amber-700 flex gap-1.5">
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              {c}
            </li>
          ))}
        </ul>
      )}

      {lender.arrangement_fee || lender.turnaround_speed ? (
        <div className="flex gap-4 text-xs text-gray-500 pt-1 border-t border-gray-50">
          {lender.arrangement_fee && <span>Fee: {lender.arrangement_fee}</span>}
          {lender.turnaround_speed && <span>Turnaround: {lender.turnaround_speed}</span>}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-2.5 py-2">
      <p className="text-gray-400 text-[10px] uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-gray-800 mt-0.5 text-sm">{value}</p>
    </div>
  );
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}
