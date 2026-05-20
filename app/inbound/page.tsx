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
  urgent: 'bg-red-100 text-red-700',
  standard: 'bg-yellow-100 text-yellow-700',
  deprioritised: 'bg-gray-100 text-gray-600',
  disqualified: 'bg-gray-900 text-white',
};

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  qualified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

function Badge({ value, styleMap, fallback = '—' }: { value: string | null; styleMap: Record<string, string>; fallback?: string }) {
  if (!value) return <span className="text-gray-300 text-xs">{fallback}</span>;
  const cls = styleMap[value] ?? 'bg-gray-100 text-gray-600';
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
    <div className="flex min-h-full">
      {/* ── Lead List ── */}
      <div className="flex-1 min-w-0 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Inbound Leads</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {leads.length} total
              {urgent > 0 && <span className="text-red-600 font-medium"> · {urgent} urgent</span>}
              {newLeads > 0 && <span className="text-blue-600 font-medium"> · {newLeads} new</span>}
            </p>
          </div>
          <a
            href="/inbound/test"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + Test Form
          </a>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>
        )}

        {!loading && !error && leads.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
            <p className="text-gray-400 text-sm mb-4">No inbound leads yet.</p>
            <a
              href="/inbound/test"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Submit a test lead
            </a>
          </div>
        )}

        {!loading && leads.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Deal Size</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Asset Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected?.id === lead.id ? 'bg-gray-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {lead.deal_size ? formatMoney(lead.deal_size) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.asset_type ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{lead.location ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <Badge value={lead.priority} styleMap={PRIORITY_STYLES} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={lead.status} styleMap={STATUS_STYLES} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
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
        <aside className="w-[460px] flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
          {/* Panel header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{selected.name ?? 'Unknown'}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge value={selected.priority} styleMap={PRIORITY_STYLES} />
                <Badge value={selected.status} styleMap={STATUS_STYLES} />
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-6 flex-1">
            {/* Contact */}
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Contact</h3>
              <dl className="space-y-2">
                <Row label="Email" value={selected.email} />
                <Row label="Phone" value={selected.phone} />
              </dl>
            </section>

            {/* Deal Details */}
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Deal Details</h3>
              <dl className="space-y-2">
                <Row label="Deal Size" value={selected.deal_size ? formatMoney(selected.deal_size) : null} />
                <Row label="Asset Type" value={selected.asset_type} />
                <Row label="Location" value={selected.location} />
                <Row label="Timeline" value={selected.timeline} />
              </dl>
            </section>

            {/* Additional Info */}
            {selected.additional_info && (
              <section>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Additional Info</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.additional_info}</p>
              </section>
            )}

            {/* Priority Reason */}
            {selected.priority_reason && (
              <section>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Priority Reason</h3>
                <p className="text-sm text-gray-600">{selected.priority_reason}</p>
              </section>
            )}

            {/* Status Update */}
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Update Status</h3>
              <div className="flex gap-2">
                <select
                  className="input flex-1"
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
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {statusSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </section>

            {/* AI Draft Response */}
            {selected.ai_draft_response && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">AI Draft Response</h3>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {copied ? (
                      <span className="text-green-600">Copied</span>
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
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{selected.ai_draft_response}</pre>
                </div>
              </section>
            )}

            {/* Received */}
            <p className="text-xs text-gray-400 pb-2">
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
      <dt className="text-gray-400 w-24 flex-shrink-0">{label}</dt>
      <dd className="text-gray-800">{value ?? <span className="text-gray-300">—</span>}</dd>
    </div>
  );
}
