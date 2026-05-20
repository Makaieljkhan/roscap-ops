'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ContactData {
  id?: string;
  full_name: string;
  preferred_name: string;
  company: string;
  contact_type: string;
  email: string;
  phone: string;
  relationship_health: string;
  last_contact_date: string;
  birthday: string;
  deal_tier_preference: string;
  pipeline_note: string;
  notes: string;
  last_deal_type: string;
  last_deal_size: string;
  last_deal_date: string;
}

const EMPTY: ContactData = {
  full_name: '',
  preferred_name: '',
  company: '',
  contact_type: '',
  email: '',
  phone: '',
  relationship_health: 'active',
  last_contact_date: '',
  birthday: '',
  deal_tier_preference: '',
  pipeline_note: '',
  notes: '',
  last_deal_type: '',
  last_deal_size: '',
  last_deal_date: '',
};

interface Props {
  mode: 'create' | 'edit';
  initialData?: Partial<ContactData> & { id?: string };
  onSuccess?: (contact: ContactData & { id: string }) => void;
  onCancel?: () => void;
}

export default function ContactForm({ mode, initialData, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ContactData>({ ...EMPTY, ...initialData });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...form,
      last_deal_size: form.last_deal_size ? parseFloat(form.last_deal_size) : null,
      preferred_name: form.preferred_name || null,
      company: form.company || null,
      contact_type: form.contact_type || null,
      email: form.email || null,
      phone: form.phone || null,
      last_contact_date: form.last_contact_date || null,
      birthday: form.birthday || null,
      deal_tier_preference: form.deal_tier_preference || null,
      pipeline_note: form.pipeline_note || null,
      notes: form.notes || null,
      last_deal_type: form.last_deal_type || null,
      last_deal_date: form.last_deal_date || null,
    };

    try {
      const url = mode === 'create'
        ? '/api/crm/contacts'
        : `/api/crm/contacts/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to save contact');
        return;
      }

      if (onSuccess) {
        onSuccess(data);
      } else {
        router.push('/crm');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Identity */}
      <section>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Identity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="full_name">Full Name *</label>
            <input id="full_name" name="full_name" className="input" required value={form.full_name} onChange={handleChange} placeholder="Full legal name" />
          </div>
          <div>
            <label className="label" htmlFor="preferred_name">Preferred Name</label>
            <input id="preferred_name" name="preferred_name" className="input" value={form.preferred_name} onChange={handleChange} placeholder="What they go by" />
          </div>
          <div>
            <label className="label" htmlFor="company">Company</label>
            <input id="company" name="company" className="input" value={form.company} onChange={handleChange} placeholder="Company or firm" />
          </div>
          <div>
            <label className="label" htmlFor="contact_type">Contact Type</label>
            <select id="contact_type" name="contact_type" className="input" value={form.contact_type} onChange={handleChange}>
              <option value="">Select…</option>
              <option value="client">Client</option>
              <option value="introducer">Introducer</option>
              <option value="lender">Lender</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="input" value={form.email} onChange={handleChange} placeholder="email@example.com" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" className="input" value={form.phone} onChange={handleChange} placeholder="07700 900000" />
          </div>
        </div>
      </section>

      {/* Relationship */}
      <section>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Relationship</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="relationship_health">Relationship Health</label>
            <select id="relationship_health" name="relationship_health" className="input" value={form.relationship_health} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="warm">Warm</option>
              <option value="at_risk">At Risk</option>
              <option value="dormant">Dormant</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="deal_tier_preference">Deal Tier Preference</label>
            <input id="deal_tier_preference" name="deal_tier_preference" className="input" value={form.deal_tier_preference} onChange={handleChange} placeholder="e.g. Tier 1 — £5M+" />
          </div>
          <div>
            <label className="label" htmlFor="last_contact_date">Last Contact Date</label>
            <input id="last_contact_date" name="last_contact_date" type="date" className="input" value={form.last_contact_date} onChange={handleChange} />
          </div>
          <div>
            <label className="label" htmlFor="birthday">Birthday</label>
            <input id="birthday" name="birthday" type="date" className="input" value={form.birthday} onChange={handleChange} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="pipeline_note">Pipeline Note</label>
            <textarea id="pipeline_note" name="pipeline_note" className="input resize-none" rows={3} value={form.pipeline_note} onChange={handleChange} placeholder="Active opportunity or deal being worked on…" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" className="input resize-none" rows={3} value={form.notes} onChange={handleChange} placeholder="Background, preferences, anything useful…" />
          </div>
        </div>
      </section>

      {/* Last Deal */}
      <section>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Last Deal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="last_deal_type">Deal Type</label>
            <input id="last_deal_type" name="last_deal_type" className="input" value={form.last_deal_type} onChange={handleChange} placeholder="e.g. Bridging Finance" />
          </div>
          <div>
            <label className="label" htmlFor="last_deal_size">Deal Size (£)</label>
            <input id="last_deal_size" name="last_deal_size" type="number" className="input" value={form.last_deal_size} onChange={handleChange} placeholder="e.g. 1500000" />
          </div>
          <div>
            <label className="label" htmlFor="last_deal_date">Deal Date</label>
            <input id="last_deal_date" name="last_deal_date" type="date" className="input" value={form.last_deal_date} onChange={handleChange} />
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : mode === 'create' ? 'Add Contact' : 'Save Changes'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
