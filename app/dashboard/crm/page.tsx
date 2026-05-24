'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  last_deal_date: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  pipeline_note: string | null;
  notes: string | null;
  deal_tier_preference: string | null;
  created_at: string;
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
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warm: 'bg-amber-50 text-amber-700 border border-amber-200',
  at_risk: 'bg-orange-50 text-orange-700 border border-orange-200',
  dormant: 'bg-gray-50 text-gray-600 border border-gray-200',
};

const HEALTH_STYLES_SELECTED: Record<string, string> = {
  active: 'bg-white/20 text-white border border-white/30',
  warm: 'bg-white/20 text-white border border-white/30',
  at_risk: 'bg-white/20 text-white border border-white/30',
  dormant: 'bg-white/20 text-white border border-white/30',
};

const TYPE_STYLES: Record<string, string> = {
  client: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  introducer: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  lender: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const TYPE_STYLES_SELECTED: Record<string, string> = {
  client: 'bg-white/20 text-white border border-white/30',
  introducer: 'bg-white/20 text-white border border-white/30',
  lender: 'bg-white/20 text-white border border-white/30',
};

const REMINDER_STYLES: Record<string, string> = {
  anniversary: 'bg-sky-50 text-sky-700 border border-sky-200',
  birthday: 'bg-pink-50 text-pink-700 border border-pink-200',
  dormancy: 'bg-amber-50 text-amber-700 border border-amber-200',
  pipeline: 'bg-blue-50 text-blue-700 border border-blue-200',
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

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-3">
      <dt className="text-[#7a9080] text-sm w-28 flex-shrink-0">{label}</dt>
      <dd className="text-[#0d2b1f] text-sm font-medium">
        {value || <span className="text-[#aaa] font-normal">—</span>}
      </dd>
    </div>
  );
}

export default function CRMPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await fetch(`/api/crm/${selected.id}`, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== selected.id));
      setSelected(null);
      setConfirmDelete(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  function handleSelectContact(contact: Contact) {
    setSelected(contact);
    setConfirmDelete(false);
  }

  return (
    <div className="flex min-h-full">
      {/* ── Contacts List ── */}
      <div className="flex-1 min-w-0 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-[2.2rem] font-light italic text-[#0d2b1f]">CRM</h1>
            <p className="text-sm text-[#7a9080] mt-0.5">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/dashboard/crm/new"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-[#0d2b1f] text-white hover:bg-[#1a4030] transition-all"
          >
            + Add Contact
          </Link>
        </div>

        {/* Search */}
        <div className="mb-5 relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4a7060] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-300 mb-5">{contactsError}</div>
        )}

        {loadingContacts && <div className="text-sm text-[#4a7060] py-12 text-center">Loading…</div>}

        {!loadingContacts && filteredContacts.length === 0 && (
          <div className="bg-[#132019] rounded-xl border border-[#1e3328] shadow-sm border-dashed p-16 text-center">
            <p className="text-[#4a7060] text-sm mb-4">{search ? 'No contacts match your search.' : 'No contacts yet.'}</p>
            {!search && (
              <Link href="/dashboard/crm/new" className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-[#c9a84c] text-[#0b1612] hover:bg-[#e2c47a] transition-all">
                Add your first contact
              </Link>
            )}
          </div>
        )}

        {!loadingContacts && filteredContacts.length > 0 && (
          <div className="bg-white rounded-xl border border-[#ddd6c8] shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Health</th>
                  <th>Last Contact</th>
                  <th>Last Deal</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(c => {
                  const isSelected = selected?.id === c.id;
                  return (
                  <tr
                    key={c.id}
                    onClick={() => handleSelectContact(c)}
                    className={`transition-colors duration-100 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0d2b1f] text-white'
                        : 'hover:bg-[#f0ebe0]'
                    }`}
                  >
                    <td>
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-[#0d2b1f]'}`}>{c.full_name}</span>
                      {c.preferred_name && c.preferred_name !== c.full_name && (
                        <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#7a9080]'}`}>{c.preferred_name}</p>
                      )}
                    </td>
                    <td className={isSelected ? 'text-white' : 'text-[#3d5a4a]'}>
                      {c.company ?? <span className={isSelected ? 'text-white/60' : 'text-[#aaa]'}>—</span>}
                    </td>
                    <td>
                      {c.contact_type ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${
                          isSelected
                            ? TYPE_STYLES_SELECTED[c.contact_type] ?? 'bg-white/20 text-white border-white/30'
                            : TYPE_STYLES[c.contact_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {c.contact_type}
                        </span>
                      ) : <span className={`text-xs ${isSelected ? 'text-white/60' : 'text-[#aaa]'}`}>—</span>}
                    </td>
                    <td>
                      {c.relationship_health ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? HEALTH_STYLES_SELECTED[c.relationship_health] ?? 'bg-white/20 text-white border-white/30'
                            : HEALTH_STYLES[c.relationship_health] ?? 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {c.relationship_health.replace('_', ' ')}
                        </span>
                      ) : <span className={`text-xs ${isSelected ? 'text-white/60' : 'text-[#aaa]'}`}>—</span>}
                    </td>
                    <td className={`text-xs whitespace-nowrap ${isSelected ? 'text-white' : 'text-[#7a9080]'}`}>{formatDate(c.last_contact_date)}</td>
                    <td className={`whitespace-nowrap ${isSelected ? 'text-white' : 'text-[#0d2b1f]'}`}>{formatMoney(c.last_deal_size)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Right Panel: Contact Detail or Reminders ── */}
      {selected ? (
        <aside className="w-[400px] flex-shrink-0 border-l border-[#ddd6c8] bg-white overflow-y-auto flex flex-col shadow-lg">
          <div className="sticky top-0 bg-white border-b border-[#ddd6c8] px-5 py-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[#0d2b1f] font-semibold text-lg truncate">{selected.full_name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {selected.company && <span className="text-[#3d5a4a] text-sm">{selected.company}</span>}
                {selected.contact_type && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${TYPE_STYLES[selected.contact_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {selected.contact_type}
                  </span>
                )}
                {selected.relationship_health && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${HEALTH_STYLES[selected.relationship_health] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {selected.relationship_health.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => { setSelected(null); setConfirmDelete(false); }}
              className="text-[#7a9080] hover:text-[#0d2b1f] flex-shrink-0 mt-0.5 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-5 space-y-6 flex-1">
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/crm/${selected.id}/edit`}
                className="inline-flex items-center px-4 py-2 text-sm rounded-lg bg-[#c9a84c] text-[#0d2b1f] font-semibold hover:bg-[#e2c47a] transition-all"
              >
                Edit
              </Link>
              {confirmDelete ? (
                <div className="flex items-center gap-2 flex-1">
                  <p className="text-xs text-[#3d5a4a] flex-1">Delete {selected.full_name}? This cannot be undone.</p>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1.5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>

            <section>
              <h3 className="text-[#c9a84c] text-xs font-bold uppercase tracking-widest mb-3">Contact Details</h3>
              <dl className="space-y-2">
                <Row label="Email" value={selected.email} />
                <Row label="Phone" value={selected.phone} />
                <Row label="Birthday" value={formatDate(selected.birthday)} />
                <Row label="Last Contact" value={formatDate(selected.last_contact_date)} />
                <Row label="Deal Tier" value={selected.deal_tier_preference} />
              </dl>
            </section>

            <section>
              <h3 className="text-[#c9a84c] text-xs font-bold uppercase tracking-widest mb-3">Last Deal</h3>
              <dl className="space-y-2">
                <Row label="Type" value={selected.last_deal_type} />
                <Row label="Size" value={formatMoney(selected.last_deal_size)} />
                <Row label="Date" value={formatDate(selected.last_deal_date)} />
              </dl>
            </section>

            {selected.pipeline_note && (
              <section>
                <h3 className="text-[#c9a84c] text-xs font-bold uppercase tracking-widest mb-2">Pipeline Note</h3>
                <p className="text-[#0d2b1f] text-sm leading-relaxed">{selected.pipeline_note}</p>
              </section>
            )}

            {selected.notes && (
              <section>
                <h3 className="text-[#c9a84c] text-xs font-bold uppercase tracking-widest mb-2">Notes</h3>
                <p className="text-[#0d2b1f] text-sm leading-relaxed">{selected.notes}</p>
              </section>
            )}

            <p className="text-[#7a9080] text-xs pb-2">
              Added {new Date(selected.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </aside>
      ) : (
        /* ── Reminders Panel ── */
        <aside className="w-80 flex-shrink-0 border-l border-[#ddd6c8] bg-[#f5f0e8] overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-[#f5f0e8] border-b border-[#ddd6c8] px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[#0d2b1f] font-semibold">Reminders</p>
                <p className="text-[#7a9080] text-sm mt-0.5">{reminders.length} pending</p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-[#c9a84c] text-[#0d2b1f] font-semibold rounded-lg px-4 py-2 hover:bg-[#e2c47a] transition-all text-sm disabled:opacity-50"
              >
                {generating ? 'Running…' : 'Generate'}
              </button>
            </div>
            {generateResult && (
              <p className="text-xs text-[#3d5a4a] bg-white border border-[#ddd6c8] rounded-lg px-3 py-2">{generateResult}</p>
            )}
          </div>

          <div className="flex-1 px-4 py-4 space-y-3">
            {loadingReminders && <p className="text-[#7a9080] text-sm text-center py-8">Loading…</p>}
            {!loadingReminders && reminders.length === 0 && (
              <p className="text-[#7a9080] text-sm text-center py-8">
                No pending reminders. Click Generate to check for new ones.
              </p>
            )}
            {reminders.map(r => (
              <ReminderCard key={r.id} reminder={r} onDismiss={handleDismiss} />
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

function ReminderCard({ reminder, onDismiss }: { reminder: Reminder; onDismiss: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const contactName = reminder.contacts?.full_name ?? 'Unknown';

  return (
    <div className="bg-white border border-[#ddd6c8] rounded-xl p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[#0d2b1f] font-semibold text-sm truncate">{contactName}</p>
          {reminder.contacts?.company && (
            <p className="text-[#7a9080] text-xs truncate">{reminder.contacts.company}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(reminder.id)}
          className="text-[#7a9080] hover:text-[#0d2b1f] transition-colors flex-shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
            REMINDER_STYLES[reminder.reminder_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          {REMINDER_LABELS[reminder.reminder_type]}
        </span>
        <span className="text-[#7a9080] text-xs">
          {new Date(reminder.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {reminder.ai_draft_message && (
        <div>
          <p className={`text-[#3d5a4a] text-sm leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {reminder.ai_draft_message}
          </p>
          {reminder.ai_draft_message.length > 120 && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="text-[#c9a84c] text-xs font-medium hover:underline cursor-pointer mt-1"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
