'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ContactForm, { ContactData } from '@/components/ContactForm';

interface Contact extends ContactData {
  id: string;
  created_at: string;
  last_deal_size: string;
}

function formatMoney(n: number | null | undefined): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/contacts/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Not found');
      setContact(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchContact(); }, [fetchContact]);

  async function handleDelete() {
    if (!confirm(`Delete ${contact?.full_name}? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/crm/contacts/${params.id}`, { method: 'DELETE' });
    router.push('/crm');
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>;
  if (error) return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
    </div>
  );
  if (!contact) return null;

  if (editing) {
    const initialData: Partial<ContactData> & { id: string } = {
      ...contact,
      last_deal_size: contact.last_deal_size ? String(contact.last_deal_size) : '',
      last_contact_date: contact.last_contact_date ?? '',
      last_deal_date: contact.last_deal_date ?? '',
      birthday: contact.birthday ?? '',
    };

    return (
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <button onClick={() => setEditing(false)} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Cancel Edit
          </button>
          <h1 className="text-2xl font-serif font-semibold text-[#1B3A35] mt-2">Edit Contact</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <ContactForm
            mode="edit"
            initialData={initialData}
            onSuccess={(updated) => { setContact(updated as Contact); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link href="/crm" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Contacts
          </Link>
          <h1 className="text-2xl font-serif font-semibold text-[#1B3A35] mt-2">{contact.full_name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {contact.company && <span className="text-sm text-gray-500">{contact.company}</span>}
            {contact.contact_type && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TYPE_STYLES[contact.contact_type] ?? 'bg-gray-100 text-gray-600'}`}>
                {contact.contact_type}
              </span>
            )}
            {contact.relationship_health && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${HEALTH_STYLES[contact.relationship_health] ?? 'bg-gray-100 text-gray-600'}`}>
                {contact.relationship_health.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="bg-[#1B3A35] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#C9A84C] hover:text-[#1B3A35] transition-all duration-200"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Contact info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Contact Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Field label="Preferred Name" value={contact.preferred_name} />
            <Field label="Email" value={contact.email} />
            <Field label="Phone" value={contact.phone} />
            <Field label="Last Contact" value={formatDate(contact.last_contact_date)} />
            <Field label="Deal Tier Preference" value={contact.deal_tier_preference} />
            <Field label="Birthday" value={formatDate(contact.birthday)} />
          </div>
        </div>

        {/* Last deal */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Last Deal</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Field label="Type" value={contact.last_deal_type} />
            <Field label="Size" value={formatMoney(Number(contact.last_deal_size))} />
            <Field label="Date" value={formatDate(contact.last_deal_date)} />
          </div>
        </div>

        {/* Pipeline */}
        {contact.pipeline_note && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Pipeline Note</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{contact.pipeline_note}</p>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Notes</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{contact.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
