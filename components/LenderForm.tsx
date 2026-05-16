'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Lender, LenderInsert, LenderStatus, KeyContact } from '@/types';
import {
  LENDER_STATUSES,
  LENDER_STATUS_LABELS,
  COMMON_ASSET_CLASSES,
} from '@/types';

interface Props {
  lender?: Lender;
  mode: 'create' | 'edit';
}

const EMPTY_FORM: LenderInsert = {
  lender_name: '',
  common_name: null,
  asset_class_appetite: [],
  geography: null,
  deal_size_min: null,
  deal_size_max: null,
  ltv_standard: null,
  ltv_stretch: null,
  rate_range_low: null,
  rate_range_high: null,
  arrangement_fee: null,
  exit_fee: null,
  turnaround_speed: null,
  current_status: null,
  key_contacts: [],
  recent_deal_experience: null,
  suleman_notes: null,
};

const EMPTY_CONTACT = { name: '', role: '', phone: '', email: '' };

export default function LenderForm({ lender, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftContact, setDraftContact] = useState(EMPTY_CONTACT);
  const [customAsset, setCustomAsset] = useState('');

  const [form, setForm] = useState<LenderInsert>(
    lender
      ? {
          lender_name: lender.lender_name,
          common_name: lender.common_name,
          asset_class_appetite: lender.asset_class_appetite,
          geography: lender.geography,
          deal_size_min: lender.deal_size_min,
          deal_size_max: lender.deal_size_max,
          ltv_standard: lender.ltv_standard,
          ltv_stretch: lender.ltv_stretch,
          rate_range_low: lender.rate_range_low,
          rate_range_high: lender.rate_range_high,
          arrangement_fee: lender.arrangement_fee,
          exit_fee: lender.exit_fee,
          turnaround_speed: lender.turnaround_speed,
          current_status: lender.current_status,
          key_contacts: lender.key_contacts ?? [],
          recent_deal_experience: lender.recent_deal_experience,
          suleman_notes: lender.suleman_notes,
        }
      : EMPTY_FORM
  );

  function toggleAssetClass(cls: string) {
    const current = form.asset_class_appetite;
    setForm({
      ...form,
      asset_class_appetite: current.includes(cls)
        ? current.filter((x) => x !== cls)
        : [...current, cls],
    });
  }

  function addCustomAsset() {
    const a = customAsset.trim();
    if (a && !form.asset_class_appetite.includes(a)) {
      setForm({ ...form, asset_class_appetite: [...form.asset_class_appetite, a] });
    }
    setCustomAsset('');
  }

  function addContact() {
    if (!draftContact.name.trim()) return;
    const contact: KeyContact = {
      name: draftContact.name.trim(),
      role: draftContact.role.trim() || undefined,
      phone: draftContact.phone.trim() || undefined,
      email: draftContact.email.trim() || undefined,
    };
    setForm({ ...form, key_contacts: [...form.key_contacts, contact] });
    setDraftContact(EMPTY_CONTACT);
  }

  function removeContact(index: number) {
    setForm({ ...form, key_contacts: form.key_contacts.filter((_, i) => i !== index) });
  }

  function numVal(v: number | null) {
    return v ?? '';
  }

  function parseNum(s: string): number | null {
    return s === '' ? null : Number(s);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const url = mode === 'edit' ? `/api/lenders/${lender!.id}` : '/api/lenders';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      router.push('/lenders');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!lender || !confirm(`Delete "${lender.lender_name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lenders/${lender.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      router.push('/lenders');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Identity */}
      <Section title="Lender Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">Legal / Full Name</label>
            <input
              required
              className="input"
              placeholder="e.g. Pepper Money Limited"
              value={form.lender_name}
              onChange={(e) => setForm({ ...form, lender_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Common Name</label>
            <input
              className="input"
              placeholder="e.g. Pepper"
              value={form.common_name ?? ''}
              onChange={(e) => setForm({ ...form, common_name: e.target.value || null })}
            />
          </div>
          <div>
            <label className="label">Current Status</label>
            <select
              className="input"
              value={form.current_status ?? ''}
              onChange={(e) =>
                setForm({ ...form, current_status: (e.target.value as LenderStatus) || null })
              }
            >
              <option value="">— select —</option>
              {LENDER_STATUSES.map((s) => (
                <option key={s} value={s}>{LENDER_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Geography</label>
            <input
              className="input"
              placeholder="e.g. National, Eastern Seaboard, NSW/VIC only"
              value={form.geography ?? ''}
              onChange={(e) => setForm({ ...form, geography: e.target.value || null })}
            />
          </div>
        </div>
      </Section>

      {/* Asset Class Appetite */}
      <Section title="Asset Class Appetite">
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_ASSET_CLASSES.map((cls) => (
            <CheckPill
              key={cls}
              label={cls}
              checked={form.asset_class_appetite.includes(cls)}
              onChange={() => toggleAssetClass(cls)}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Add custom asset class…"
            value={customAsset}
            onChange={(e) => setCustomAsset(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAsset(); } }}
          />
          <button
            type="button"
            onClick={addCustomAsset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            Add
          </button>
        </div>
        {form.asset_class_appetite.filter((a) => !COMMON_ASSET_CLASSES.includes(a)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.asset_class_appetite
              .filter((a) => !COMMON_ASSET_CLASSES.includes(a))
              .map((a) => (
                <span key={a} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                  {a}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, asset_class_appetite: form.asset_class_appetite.filter((x) => x !== a) })
                    }
                    className="ml-0.5 text-indigo-400 hover:text-indigo-700"
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        )}
      </Section>

      {/* Deal Parameters */}
      <Section title="Deal Parameters">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <label className="label">Min Deal Size ($)</label>
            <input
              type="number"
              min={0}
              step={50000}
              className="input"
              placeholder="e.g. 500000"
              value={numVal(form.deal_size_min)}
              onChange={(e) => setForm({ ...form, deal_size_min: parseNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Max Deal Size ($)</label>
            <input
              type="number"
              min={0}
              step={50000}
              className="input"
              placeholder="e.g. 20000000"
              value={numVal(form.deal_size_max)}
              onChange={(e) => setForm({ ...form, deal_size_max: parseNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">LTV Standard (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              className="input"
              placeholder="e.g. 65"
              value={numVal(form.ltv_standard)}
              onChange={(e) => setForm({ ...form, ltv_standard: parseNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">LTV Stretch (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              className="input"
              placeholder="e.g. 75"
              value={numVal(form.ltv_stretch)}
              onChange={(e) => setForm({ ...form, ltv_stretch: parseNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Rate Low (%)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="input"
              placeholder="e.g. 6.5"
              value={numVal(form.rate_range_low)}
              onChange={(e) => setForm({ ...form, rate_range_low: parseNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Rate High (%)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="input"
              placeholder="e.g. 9.5"
              value={numVal(form.rate_range_high)}
              onChange={(e) => setForm({ ...form, rate_range_high: parseNum(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Arrangement Fee</label>
            <input
              className="input"
              placeholder="e.g. 1.5%, negotiable"
              value={form.arrangement_fee ?? ''}
              onChange={(e) => setForm({ ...form, arrangement_fee: e.target.value || null })}
            />
          </div>
          <div>
            <label className="label">Exit Fee</label>
            <input
              className="input"
              placeholder="e.g. Nil, 1% if < 12 months"
              value={form.exit_fee ?? ''}
              onChange={(e) => setForm({ ...form, exit_fee: e.target.value || null })}
            />
          </div>
        </div>
        <div className="mt-5">
          <label className="label">Turnaround Speed</label>
          <input
            className="input"
            placeholder="e.g. 3–5 business days to indicative, 2–3 weeks to formal"
            value={form.turnaround_speed ?? ''}
            onChange={(e) => setForm({ ...form, turnaround_speed: e.target.value || null })}
          />
        </div>
      </Section>

      {/* Key Contacts */}
      <Section title="Key Contacts">
        {form.key_contacts.length > 0 && (
          <div className="space-y-2 mb-4">
            {form.key_contacts.map((contact, i) => (
              <div key={i} className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-3 gap-4">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {[contact.role, contact.phone, contact.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeContact(i)}
                  className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="border border-dashed border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add Contact</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              className="input"
              placeholder="Name *"
              value={draftContact.name}
              onChange={(e) => setDraftContact({ ...draftContact, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Role / Title"
              value={draftContact.role}
              onChange={(e) => setDraftContact({ ...draftContact, role: e.target.value })}
            />
            <input
              className="input"
              placeholder="Phone"
              value={draftContact.phone}
              onChange={(e) => setDraftContact({ ...draftContact, phone: e.target.value })}
            />
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={draftContact.email}
              onChange={(e) => setDraftContact({ ...draftContact, email: e.target.value })}
            />
          </div>
          <button
            type="button"
            onClick={addContact}
            disabled={!draftContact.name.trim()}
            className="text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 px-4 py-1.5 rounded-lg transition-colors"
          >
            + Add Contact
          </button>
        </div>
      </Section>

      {/* Intelligence */}
      <Section title="Deal Intelligence">
        <div className="space-y-4">
          <div>
            <label className="label">Recent Deal Experience</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Recent transactions this lender has funded, deal types, deal sizes, sectors…"
              value={form.recent_deal_experience ?? ''}
              onChange={(e) => setForm({ ...form, recent_deal_experience: e.target.value || null })}
            />
          </div>
          <div>
            <label className="label">Suleman's Notes</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="BDM relationships, policy quirks, appetite nuances, things to watch…"
              value={form.suleman_notes ?? ''}
              onChange={(e) => setForm({ ...form, suleman_notes: e.target.value || null })}
            />
          </div>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create Lender' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete Lender'}
          </button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </div>
  );
}

function CheckPill({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
        checked
          ? 'bg-gray-900 border-gray-900 text-white'
          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
}
