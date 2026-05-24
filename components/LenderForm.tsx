'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Lender, LenderInsert, LenderStatus, KeyContact } from '@/types';
import {
  LENDER_STATUSES,
  LENDER_STATUS_LABELS,
  COMMON_ASSET_CLASSES,
} from '@/types';
import { Card, Button, Input, Textarea, Select, SectionTitle } from '@/components/ui';

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

const STATUS_OPTIONS = [
  { value: '', label: '— select —' },
  ...LENDER_STATUSES.map((s) => ({ value: s, label: LENDER_STATUS_LABELS[s] })),
];

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
      router.push('/dashboard/lenders');
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
      router.push('/dashboard/lenders');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card>
        <SectionTitle>Lender Identity</SectionTitle>
        <div className="grid grid-cols-2 gap-5">
          <Input
            label="Legal / Full Name"
            required
            placeholder="e.g. Pepper Money Limited"
            value={form.lender_name}
            onChange={(e) => setForm({ ...form, lender_name: e.target.value })}
          />
          <Input
            label="Common Name"
            placeholder="e.g. Pepper"
            value={form.common_name ?? ''}
            onChange={(e) => setForm({ ...form, common_name: e.target.value || null })}
          />
          <Select
            label="Current Status"
            options={STATUS_OPTIONS}
            value={form.current_status ?? ''}
            onChange={(e) =>
              setForm({ ...form, current_status: (e.target.value as LenderStatus) || null })
            }
          />
          <Input
            label="Geography"
            placeholder="e.g. National, London & South East"
            value={form.geography ?? ''}
            onChange={(e) => setForm({ ...form, geography: e.target.value || null })}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle>Asset Class Appetite</SectionTitle>
        <div className="flex flex-wrap gap-2 mb-4">
          {COMMON_ASSET_CLASSES.map((cls) => (
            <CheckPill
              key={cls}
              label={cls}
              checked={form.asset_class_appetite.includes(cls)}
              onChange={() => toggleAssetClass(cls)}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Input
            label="Custom Asset Class"
            placeholder="Add custom asset class…"
            value={customAsset}
            onChange={(e) => setCustomAsset(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomAsset();
              }
            }}
          />
          <div className="flex items-end">
            <Button type="button" variant="ghost" onClick={addCustomAsset} className="w-full">
              Add Class
            </Button>
          </div>
        </div>
        {form.asset_class_appetite.filter((a) => !COMMON_ASSET_CLASSES.includes(a)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {form.asset_class_appetite
              .filter((a) => !COMMON_ASSET_CLASSES.includes(a))
              .map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 text-sm bg-[#0d2b1f] text-white border border-[#0d2b1f] rounded-full px-3 py-1.5"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        asset_class_appetite: form.asset_class_appetite.filter((x) => x !== a),
                      })
                    }
                    className="ml-0.5 opacity-70 hover:opacity-100"
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Deal Parameters</SectionTitle>
        <div className="grid grid-cols-2 gap-5">
          <Input
            label="Min Deal Size (£)"
            type="number"
            min={0}
            step={50000}
            placeholder="e.g. 500000"
            value={numVal(form.deal_size_min)}
            onChange={(e) => setForm({ ...form, deal_size_min: parseNum(e.target.value) })}
          />
          <Input
            label="Max Deal Size (£)"
            type="number"
            min={0}
            step={50000}
            placeholder="e.g. 20000000"
            value={numVal(form.deal_size_max)}
            onChange={(e) => setForm({ ...form, deal_size_max: parseNum(e.target.value) })}
          />
          <Input
            label="LTV Standard (%)"
            type="number"
            min={0}
            max={100}
            step={0.5}
            placeholder="e.g. 65"
            value={numVal(form.ltv_standard)}
            onChange={(e) => setForm({ ...form, ltv_standard: parseNum(e.target.value) })}
          />
          <Input
            label="LTV Stretch (%)"
            type="number"
            min={0}
            max={100}
            step={0.5}
            placeholder="e.g. 75"
            value={numVal(form.ltv_stretch)}
            onChange={(e) => setForm({ ...form, ltv_stretch: parseNum(e.target.value) })}
          />
          <Input
            label="Rate Low (%)"
            type="number"
            min={0}
            step={0.01}
            placeholder="e.g. 6.5"
            value={numVal(form.rate_range_low)}
            onChange={(e) => setForm({ ...form, rate_range_low: parseNum(e.target.value) })}
          />
          <Input
            label="Rate High (%)"
            type="number"
            min={0}
            step={0.01}
            placeholder="e.g. 9.5"
            value={numVal(form.rate_range_high)}
            onChange={(e) => setForm({ ...form, rate_range_high: parseNum(e.target.value) })}
          />
          <Input
            label="Arrangement Fee"
            placeholder="e.g. 1.5%, negotiable"
            value={form.arrangement_fee ?? ''}
            onChange={(e) => setForm({ ...form, arrangement_fee: e.target.value || null })}
          />
          <Input
            label="Exit Fee"
            placeholder="e.g. Nil, 1% if < 12 months"
            value={form.exit_fee ?? ''}
            onChange={(e) => setForm({ ...form, exit_fee: e.target.value || null })}
          />
        </div>
        <div className="mt-5">
          <Input
            label="Turnaround Speed"
            placeholder="e.g. 3–5 business days to indicative, 2–3 weeks to formal"
            value={form.turnaround_speed ?? ''}
            onChange={(e) => setForm({ ...form, turnaround_speed: e.target.value || null })}
          />
        </div>
      </Card>

      <Card>
        <SectionTitle>Key Contacts</SectionTitle>
        {form.key_contacts.length > 0 && (
          <div className="space-y-2 mb-4">
            {form.key_contacts.map((contact, i) => (
              <div
                key={i}
                className="flex items-start justify-between bg-[#f5f0e8] border border-[#ddd6c8] rounded-lg px-4 py-3 gap-4"
              >
                <div className="text-sm">
                  <p className="font-medium text-[#0d2b1f]">{contact.name}</p>
                  <p className="text-[#7a9080] text-xs mt-0.5">
                    {[contact.role, contact.phone, contact.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeContact(i)}
                  className="text-xs text-red-500 hover:text-red-700 flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="border border-dashed border-[#ddd6c8] rounded-lg p-4 space-y-4 bg-[#faf8f4]">
          <p className="text-xs font-semibold text-[#3d5a4a] uppercase tracking-wider">Add Contact</p>
          <div className="grid grid-cols-2 gap-5">
            <Input
              label="Name"
              required
              placeholder="Contact name"
              value={draftContact.name}
              onChange={(e) => setDraftContact({ ...draftContact, name: e.target.value })}
            />
            <Input
              label="Role / Title"
              placeholder="e.g. BDM"
              value={draftContact.role}
              onChange={(e) => setDraftContact({ ...draftContact, role: e.target.value })}
            />
            <Input
              label="Phone"
              placeholder="Phone number"
              value={draftContact.phone}
              onChange={(e) => setDraftContact({ ...draftContact, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="email@lender.com"
              value={draftContact.email}
              onChange={(e) => setDraftContact({ ...draftContact, email: e.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addContact}
            disabled={!draftContact.name.trim()}
          >
            + Add Contact
          </Button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Deal Intelligence</SectionTitle>
        <Textarea
          label="Recent Deal Experience"
          rows={4}
          placeholder="Recent transactions this lender has funded, deal types, deal sizes, sectors…"
          value={form.recent_deal_experience ?? ''}
          onChange={(e) => setForm({ ...form, recent_deal_experience: e.target.value || null })}
        />
      </Card>

      <Card>
        <SectionTitle>Comments</SectionTitle>
        <Textarea
          label="Comments"
          rows={5}
          placeholder="Add any notes, observations, or context about this lender…"
          value={form.suleman_notes ?? ''}
          onChange={(e) => setForm({ ...form, suleman_notes: e.target.value || null })}
        />
      </Card>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            {mode === 'create' ? 'Create Lender' : 'Save Changes'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
        {mode === 'edit' && (
          <Button type="button" variant="danger" onClick={handleDelete} loading={deleting}>
            Delete Lender
          </Button>
        )}
      </div>
    </form>
  );
}

function CheckPill({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-full px-3 py-1.5 text-sm cursor-pointer transition-all duration-150 border ${
        checked
          ? 'bg-[#0d2b1f] text-white border-[#0d2b1f]'
          : 'bg-[#f5f0e8] border-[#ddd6c8] text-[#3d5a4a] hover:border-[#c9a84c]'
      }`}
    >
      {label}
    </button>
  );
}
