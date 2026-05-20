'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

interface Contact {
  id: string;
  full_name: string;
  preferred_name: string | null;
  company: string | null;
  contact_type: 'client' | 'introducer' | 'lender' | null;
  relationship_health: 'active' | 'warm' | 'at_risk' | 'dormant' | null;
  last_contact_date: string | null;
  last_deal_size: number | null;
  last_deal_type: string | null;
}

interface Reminder {
  id: string;
  contact_id: string;
  reminder_type: 'anniversary' | 'birthday' | 'dormancy' | 'pipeline';
  due_date: string;
  status: string;
  ai_draft_message: string | null;
  contacts: { full_name: string; preferred_name: string | null; company: string | null } | null;
}

const HEALTH_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  warm: 'bg-yellow-100 text-yellow-700',
  at_risk: 'bg-orange-100 text-orange-700',
  dormant: 'bg-gray-100 text-gray-600',
};

const TYPE_STYLES: Record<string, string> = {
  client: 'bg-blue-100 text-blue-700',
  introducer: 'bg-purple-100 text-purple-700',
  lender: 'bg-orange-100 text-orange-700',
};

const REMINDER_STYLES: Record<string, string> = {
  anniversary: 'bg-blue-100 text-blue-700',
  birthday: 'bg-pink-100 text-pink-700',
  dormancy: 'bg-gray-100 text-gray-600',
  pipeline: 'bg-indigo-100 text-indigo-700',
};

const REMINDER_LABELS: Record<string, string> = {
  anniversary: 'Anniversary',
  birthday: 'Birthday',
  dormancy: 'Dormancy',
  pipeline: 'Pipeline',
};

function formatMoney(n: number | null): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [search, setSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState('');

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/contacts');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load contacts');
      setContacts(data);
    } catch (err: unknown) {
      setContactsError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const fetchReminders = useCallback(async () => {
    setLoadingReminders(true);
    try {
      const res = await fetch('/api/crm/reminders');
      const data = await res.json();
      if (res.ok) setReminders(data);
    } finally {
      setLoadingReminders(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); fetchReminders(); }, [fetchContacts, fetchReminders]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q)
    );
  }, [contacts, search]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const res = await fetch('/api/crm/reminders/generate', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setGenerateResult(`${data.created} new reminder${data.created !== 1 ? 's' : ''} created`);
        await fetchReminders();
      } else {
        setGenerateResult(`Error: ${data.error}`);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleDismiss(reminderId: string) {
    await fetch(`/api/crm/reminders/${reminderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dismissed' }),
    });
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  }

  return (
    <div className="flex min-h-full">
      {/* ── Contacts List ── */}
      <div className="flex-1 min-w-0 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">CRM</h1>
            <p className="text-sm text-gray-500 mt-0.5">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/crm/new"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + Add Contact
          </Link>
        </div>

        {/* Search */}
        <div className="mb-5 relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name or company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {contactsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-5">{contactsError}</div>
        )}

        {loadingContacts && <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>}

        {!loadingContacts && filteredContacts.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
            <p className="text-gray-400 text-sm mb-4">{search ? 'No contacts match your search.' : 'No contacts yet.'}</p>
            {!search && (
              <Link href="/crm/new" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                Add your first contact
              </Link>
            )}
          </div>
        )}

        {!loadingContacts && filteredContacts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Health</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Last Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Last Deal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredContacts.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/${c.id}`} className="font-medium text-gray-900 hover:underline underline-offset-2">
                        {c.full_name}
                      </Link>
                      {c.preferred_name && c.preferred_name !== c.full_name && (
                        <p className="text-xs text-gray-400 mt-0.5">{c.preferred_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.company ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      {c.contact_type ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TYPE_STYLES[c.contact_type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {c.contact_type}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {c.relationship_health ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HEALTH_STYLES[c.relationship_health] ?? 'bg-gray-100 text-gray-600'}`}>
                          {c.relationship_health.replace('_', ' ')}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(c.last_contact_date)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatMoney(c.last_deal_size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Reminders Panel ── */}
      <aside className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Reminders</p>
              <p className="text-xs text-gray-400 mt-0.5">{reminders.length} pending</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {generating ? 'Running…' : 'Generate'}
            </button>
          </div>
          {generateResult && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{generateResult}</p>
          )}
        </div>

        <div className="flex-1 px-4 py-4 space-y-3">
          {loadingReminders && <p className="text-xs text-gray-400 text-center py-8">Loading…</p>}

          {!loadingReminders && reminders.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">
              No pending reminders. Click Generate to check for new ones.
            </p>
          )}

          {reminders.map(r => (
            <ReminderCard key={r.id} reminder={r} onDismiss={handleDismiss} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function ReminderCard({ reminder, onDismiss }: { reminder: Reminder; onDismiss: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const contactName = reminder.contacts?.full_name ?? 'Unknown';

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/crm/${reminder.contact_id}`} className="text-sm font-medium text-gray-900 hover:underline underline-offset-2 truncate block">
            {contactName}
          </Link>
          {reminder.contacts?.company && (
            <p className="text-xs text-gray-400 truncate">{reminder.contacts.company}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(reminder.id)}
          className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${REMINDER_STYLES[reminder.reminder_type] ?? 'bg-gray-100 text-gray-600'}`}>
          {REMINDER_LABELS[reminder.reminder_type]}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(reminder.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {reminder.ai_draft_message && (
        <div>
          <p className={`text-xs text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {reminder.ai_draft_message}
          </p>
          {reminder.ai_draft_message.length > 120 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1 transition-colors"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
