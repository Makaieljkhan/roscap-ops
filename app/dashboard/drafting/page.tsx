'use client';

import { useState } from 'react';
import { PageHeader, Select, Textarea, Button, Card } from '@/components/ui';
import { motion } from 'framer-motion';

const DEAL_TIERS = [
  { value: 'tier1', label: 'Tier 1 — Premium (£5M+)' },
  { value: 'tier2', label: 'Tier 2 — Mid-Market (£1M–£5M)' },
  { value: 'tier3', label: 'Tier 3 — Standard (<£1M)' },
];

const EMAIL_TYPES = [
  { value: 'lender_pitch', label: 'Lender Pitch' },
  { value: 'client_update_terms', label: 'Client Update — Terms Received' },
  { value: 'client_update_dd', label: 'Client Update — Due Diligence' },
  { value: 'lender_followup', label: 'Lender Follow-Up' },
  { value: 'deal_declined', label: 'Deal Declined' },
  { value: 'completion_congratulations', label: 'Completion Congratulations' },
  { value: 'intro_new_lender', label: 'Intro — New Lender' },
  { value: 'repeat_client_checkin', label: 'Repeat Client Check-In' },
];

export default function DraftingPage() {
  const [dealTier, setDealTier] = useState('');
  const [emailType, setEmailType] = useState('');
  const [dealContext, setDealContext] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!dealTier || !emailType || !dealContext.trim()) {
      setError('Please select a deal tier, email type, and provide deal context.');
      return;
    }

    setLoading(true);
    setError('');
    setDraft('');
    setCopied(false);

    try {
      const res = await fetch('/api/drafting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_tier: dealTier, email_type: emailType, deal_context: dealContext }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to generate draft.');
        return;
      }

      setDraft(data.draft);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <PageHeader
        title="Deal Drafting"
        subtitle="Generate professional email drafts using deal context and AI-powered templates."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="space-y-5">
          <Select
            label="Deal Tier"
            options={[{ value: '', label: 'Select deal tier…' }, ...DEAL_TIERS]}
            value={dealTier}
            onChange={(e) => setDealTier(e.target.value)}
          />

          <Select
            label="Email Type"
            options={[{ value: '', label: 'Select email type…' }, ...EMAIL_TYPES]}
            value={emailType}
            onChange={(e) => setEmailType(e.target.value)}
          />

          <Textarea
            label="Deal Context"
            rows={14}
            placeholder="Paste deal details here — borrower name, loan amount, asset type, LTV, exit strategy, key contacts, timeline…"
            value={dealContext}
            onChange={(e) => setDealContext(e.target.value)}
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-300 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-2.5"
            >
              {error}
            </motion.p>
          )}

          <Button onClick={handleGenerate} loading={loading} className="w-full" size="lg" icon={<IconDraft className="w-4 h-4" />}>
            Generate Draft
          </Button>
        </Card>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#4a7060]">Generated Draft</p>
            {draft && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? '✓ Copied' : 'Copy to Clipboard'}
              </Button>
            )}
          </div>

          <Card className="flex-1 min-h-[420px] p-5 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-[#4a7060] gap-3 min-h-[360px]">
                <IconSpinner className="w-6 h-6 animate-spin text-[#c9a84c]" />
                <span className="text-xs">Drafting email…</span>
              </div>
            ) : draft ? (
              <pre className="whitespace-pre-wrap font-sans text-sm text-[#f0ebe0] leading-relaxed">{draft}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-[#4a7060] gap-2 min-h-[360px]">
                <IconDraft className="w-8 h-8 opacity-30 text-[#c9a84c]" />
                <p className="text-xs max-w-xs">
                  Select a deal tier and email type, paste your deal context, then click Generate Draft.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconDraft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
