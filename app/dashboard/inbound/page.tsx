'use client';

import { useState, useEffect, useCallback } from 'react';

interface InboundLead {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  deal_size: number | null;
  asset_type: string | null;
  location: string | null;
  timeline: string | null;
  additional_info: string | null;
  priority: 'urgent' | 'standard' | 'deprioritised' | 'disqualified' | null;
  priority_reason: string | null;
  ai_draft_response: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'rejected' | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-950/60 text-red-300 border border-red-800/50',
  standard: 'bg-amber-950/60 text-amber-300 border border-amber-800/50',
  deprioritised: 'bg-[#1a2e22] text-[#8aab95] border border-[#1e3328]',
  disqualified: 'bg-[#0e1c17] text-[#4a7060] border border-[#1e3328]',
};

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-sky-950/60 text-sky-300 border border-sky-800/50',
  contacted: 'bg-purple-950/60 text-purple-300 border border-purple-800/50',
  qualified: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50',
  rejected: 'bg-red-950/60 text-red-300 border border-red-800/50',
};

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

function Badge({ value, styleMap, fallback = '—' }: { value: string | null; styleMap: Record<string, string>; fallback?: string }) {
  if (!value) return <span className="text-[#2a4535] text-xs">{fallback}</span>;
  const cls = styleMap[value] ?? 'bg-[#1a2e22] text-[#8aab95] border border-[#1e3328]';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${cls}`}>
      {value}
    </span>
  );
}

export default function InboundPage() {
  const [leads, setLeads] = useState<InboundLead[]>([]);
  const [selected, setSelected] = useState<InboundLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusValue, setStatusValue] = useState<string>('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/inbound/leads');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load leads');
      setLeads(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    if (selected) setStatusValue(selected.status ?? 'new');
  }, [selected]);

  async function handleStatusSave() {
    if (!selected || !statusValue) return;
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/inbound/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLeads(prev => prev.map(l => l.id === data.id ? data : l));
      setSelected(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleCopy() {
    if (!selected?.ai_draft_response) return;
    await navigator.clipboard.writeText(selected.ai_draft_response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const urgent = leads.filter(l => l.priority === 'urgent').length;
  const newLeads = leads.filter(l => l.status === 'new').length;

  return (
    <div className="flex min-h-full -m-8">
      <div className="flex-1 min-w-0 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-[2.2rem] font-light italic text-[#f0ebe0]">Inbound Handler</h1>
            <p className="text-sm text-[#4a7060] mt-1.5">
              {leads.length} total
              {urgent > 0 && <span className="text-red-400 font-medium"> · {urgent} urgent</span>}
              {newLeads > 0 && <span className="text-sky-400 font-medium"> · {newLeads} new</span>}
            </p>
          </div>
          <a
            href="/dashboard/inbound/test"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#c9a84c] text-[#0b1612] hover:bg-[#e2c47a] transition-all"
          >
            + Test Form
          </a>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 text-sm text-red-300 mb-6">{error}</div>
        )}

        {loading && <div className="text-sm text-[#4a7060] py-12 text-center">Loading…</div>}

        {!loading && !error && leads.length === 0 && (
          <div className="bg-[#132019] rounded-xl border border-dashed border-[#1e3328] p-16 text-center">
            <p className="text-[#4a7060] text-sm mb-4">No inbound leads yet.</p>
            <a
              href="/dashboard/inbound/test"
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#c9a84c] text-[#0b1612] hover:bg-[#e2c47a] transition-all"
            >
              Submit a test lead
            </a>
          </div>
        )}

        {!loading && leads.length > 0 && (
          <div className="bg-[#132019] rounded-xl border border-[#1e3328] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Deal Size</th>
                  <th>Asset Type</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className={`cursor-pointer transition-colors ${selected?.id === lead.id ? 'bg-[rgba(201,168,76,0.06)]' : ''}`}
                  >
                    <td className="font-medium text-[#f0ebe0]">{lead.name ?? '—'}</td>
                    <td className="text-[#8aab95]">{lead.email ?? '—'}</td>
                    <td className="text-[#8aab95]">
                      {lead.deal_size ? formatMoney(lead.deal_size) : <span className="text-[#2a4535]">—</span>}
                    </td>
                    <td className="text-[#8aab95]">{lead.asset_type ?? <span className="text-[#2a4535]">—</span>}</td>
                    <td className="text-[#8aab95] max-w-[120px] truncate">{lead.location ?? <span className="text-[#2a4535]">—</span>}</td>
                    <td className="px-4 py-3">
                      <Badge value={lead.priority} styleMap={PRIORITY_STYLES} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={lead.status} styleMap={STATUS_STYLES} />
                    </td>
                    <td className="text-[#4a7060] whitespace-nowrap text-xs">
                      {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Panel ── */}
      {selected && (
        <aside className="w-[460px] flex-shrink-0 border-l border-[#1e3328] bg-[#0e1c17] overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-[#0e1c17] border-b border-[#1e3328] px-6 py-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[#f0ebe0] truncate">{selected.name ?? 'Unknown'}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge value={selected.priority} styleMap={PRIORITY_STYLES} />
                <Badge value={selected.status} styleMap={STATUS_STYLES} />
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-[#4a7060] hover:text-[#c9a84c] flex-shrink-0 mt-0.5 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-6 flex-1">
            <section>
              <h3 className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-3">Contact</h3>
              <dl className="space-y-2">
                <Row label="Email" value={selected.email} />
                <Row label="Phone" value={selected.phone} />
              </dl>
            </section>

            <section>
              <h3 className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-3">Deal Details</h3>
              <dl className="space-y-2">
                <Row label="Deal Size" value={selected.deal_size ? formatMoney(selected.deal_size) : null} />
                <Row label="Asset Type" value={selected.asset_type} />
                <Row label="Location" value={selected.location} />
                <Row label="Timeline" value={selected.timeline} />
              </dl>
            </section>

            {selected.additional_info && (
              <section>
                <h3 className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-3">Additional Info</h3>
                <p className="text-sm text-[#8aab95] leading-relaxed">{selected.additional_info}</p>
              </section>
            )}

            {selected.priority_reason && (
              <section>
                <h3 className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-3">Priority Reason</h3>
                <p className="text-sm text-[#8aab95]">{selected.priority_reason}</p>
              </section>
            )}

            <section>
              <h3 className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-3">Update Status</h3>
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-[#0b1612] border border-[#1e3328] rounded-lg px-4 py-2.5 text-sm text-[#f0ebe0] focus:outline-none focus:border-[#c9a84c]/50"
                  value={statusValue}
                  onChange={e => setStatusValue(e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={handleStatusSave}
                  disabled={statusSaving || statusValue === (selected.status ?? 'new')}
                  className="flex-shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#c9a84c] text-[#0b1612] hover:bg-[#e2c47a] disabled:opacity-40 transition-all"
                >
                  {statusSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </section>

            {selected.ai_draft_response && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest">AI Draft Response</h3>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#4a7060] hover:text-[#c9a84c] transition-colors"
                  >
                    {copied ? (
                      <span className="text-emerald-600">Copied</span>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#0b1612] border border-[#1e3328] rounded-xl p-4">
                  <pre className="text-sm text-[#f0ebe0] whitespace-pre-wrap font-sans leading-relaxed">{selected.ai_draft_response}</pre>
                </div>
              </section>
            )}

            <p className="text-xs text-[#2a4535] pb-2">
              Received {new Date(selected.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 text-sm">
      <dt className="text-[#4a7060] w-24 flex-shrink-0">{label}</dt>
      <dd className="text-[#f0ebe0]">{value ?? <span className="text-[#2a4535]">—</span>}</dd>
    </div>
  );
}
