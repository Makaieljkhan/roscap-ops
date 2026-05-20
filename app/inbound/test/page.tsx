'use client';

import { useState } from 'react';
import Link from 'next/link';

const ASSET_TYPES = [
  'Bridging Finance',
  'Development Finance',
  'Commercial Mortgage',
  'Semi-Commercial',
  'HMO Finance',
  'Buy-to-Let Refinance',
  'Refurbishment Finance',
  'Other',
];

const TIMELINES = [
  'ASAP / Urgent (under 1 month)',
  '1–3 months',
  '3–6 months',
  '6–12 months',
  'Over 12 months',
  'Not yet confirmed',
];

const PRESETS = [
  {
    label: 'Urgent',
    color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    data: {
      name: 'James Thornton',
      email: 'james.thornton@example.com',
      phone: '07700 900123',
      deal_size: '4500000',
      asset_type: 'Development Finance',
      location: 'London, E1',
      timeline: 'ASAP / Urgent (under 1 month)',
      additional_info: 'Brownfield site, 24 units, planning already secured. Need to move fast — preferred lender fell through.',
    },
  },
  {
    label: 'Standard',
    color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
    data: {
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@example.com',
      phone: '07800 123456',
      deal_size: '750000',
      asset_type: 'Bridging Finance',
      location: 'Manchester, M2',
      timeline: '3–6 months',
      additional_info: 'Auction purchase, mixed-use property. Need bridging while long-term finance is arranged.',
    },
  },
  {
    label: 'Deprioritised',
    color: 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100',
    data: {
      name: 'Dave Reynolds',
      email: 'dave.reynolds@example.com',
      phone: '',
      deal_size: '180000',
      asset_type: 'Buy-to-Let Refinance',
      location: 'Coventry',
      timeline: 'Not yet confirmed',
      additional_info: '',
    },
  },
  {
    label: 'Disqualified',
    color: 'bg-[#1B3A35] border-[#1B3A35] text-white hover:bg-[#2a5248]',
    data: {
      name: 'Alex Kumar',
      email: 'alex.kumar@example.com',
      phone: '',
      deal_size: '50000',
      asset_type: 'Stocks and Shares',
      location: 'Dubai',
      timeline: 'Flexible',
      additional_info: 'Looking to invest in overseas equities.',
    },
  },
];

const EMPTY = { name: '', email: '', phone: '', deal_size: '', asset_type: '', location: '', timeline: '', additional_info: '' };

export default function TestFormPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; priority?: string; lead_id?: string; error?: string } | null>(null);

  function applyPreset(data: typeof PRESETS[0]['data']) {
    setForm(data);
    setResult(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/inbound/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, deal_size: parseFloat(form.deal_size) || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ success: false, error: data.error ?? 'Submission failed' });
      } else {
        setResult({ success: true, priority: data.priority, lead_id: data.lead_id });
        setForm(EMPTY);
      }
    } catch {
      setResult({ success: false, error: 'Network error — please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/inbound" className="text-sm text-gray-400 hover:text-[#1B3A35] transition-colors">
          ← Inbound Leads
        </Link>
        <h1 className="text-2xl font-serif font-semibold text-[#1B3A35] mt-2">Test Form</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a dummy lead to test scoring, AI draft generation, and the inbound pipeline.</p>
      </div>

      {/* Preset buttons */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-3">Quick Fill</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.data)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${preset.color}`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setForm(EMPTY); setResult(null); }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {result?.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 text-sm text-emerald-800">
          Lead submitted — priority scored as <strong className="capitalize">{result.priority}</strong>.{' '}
          <Link href="/inbound" className="underline underline-offset-2">View in Inbound Leads →</Link>
        </div>
      )}
      {result?.success === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          {result.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 shadow-sm rounded-xl p-6">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="label" htmlFor="name">Name *</label>
            <input id="name" name="name" className="input" value={form.name} onChange={handleChange} required placeholder="Full name" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" className="input" value={form.email} onChange={handleChange} required placeholder="email@example.com" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" className="input" value={form.phone} onChange={handleChange} placeholder="07700 900000" />
          </div>
          <div>
            <label className="label" htmlFor="deal_size">Deal Size (£)</label>
            <input id="deal_size" name="deal_size" type="number" className="input" value={form.deal_size} onChange={handleChange} placeholder="e.g. 1500000" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="label" htmlFor="asset_type">Asset Type</label>
            <select id="asset_type" name="asset_type" className="input" value={form.asset_type} onChange={handleChange}>
              <option value="">Select…</option>
              {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" name="location" className="input" value={form.location} onChange={handleChange} placeholder="e.g. London, E1" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="timeline">Timeline</label>
          <select id="timeline" name="timeline" className="input" value={form.timeline} onChange={handleChange}>
            <option value="">Select…</option>
            {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="additional_info">Additional Info</label>
          <textarea
            id="additional_info"
            name="additional_info"
            className="input resize-none"
            rows={4}
            value={form.additional_info}
            onChange={handleChange}
            placeholder="Any other relevant details about the deal or borrower…"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1B3A35] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#C9A84C] hover:text-[#1B3A35] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting…' : 'Submit Lead'}
        </button>
      </form>
    </div>
  );
}
