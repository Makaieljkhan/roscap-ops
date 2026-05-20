'use client';

import { useState } from 'react';

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
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Deal Drafting Engine</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate professional email drafts using deal context and AI-powered templates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — Inputs */}
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="deal-tier">
              Deal Tier
            </label>
            <select
              id="deal-tier"
              className="input"
              value={dealTier}
              onChange={(e) => setDealTier(e.target.value)}
            >
              <option value="">Select deal tier…</option>
              {DEAL_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="email-type">
              Email Type
            </label>
            <select
              id="email-type"
              className="input"
              value={emailType}
              onChange={(e) => setEmailType(e.target.value)}
            >
              <option value="">Select email type…</option>
              {EMAIL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="deal-context">
              Deal Context
            </label>
            <textarea
              id="deal-context"
              className="input resize-none"
              rows={14}
              placeholder="Paste deal details here — borrower name, loan amount, asset type, LTV, exit strategy, key contacts, timeline, any other relevant information…"
              value={dealContext}
              onChange={(e) => setDealContext(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <IconSpinner className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <IconDraft className="w-4 h-4" />
                Generate Draft
              </>
            )}
          </button>
        </div>

        {/* Right — Output */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Generated Draft</label>
            {draft && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
              >
                {copied ? (
                  <>
                    <IconCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <IconCopy className="w-3.5 h-3.5" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 min-h-[420px] bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-800 leading-relaxed overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <IconSpinner className="w-6 h-6 animate-spin" />
                <span className="text-xs">Drafting email…</span>
              </div>
            ) : draft ? (
              <pre className="whitespace-pre-wrap font-sans">{draft}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
                <IconDraft className="w-8 h-8 opacity-30" />
                <p className="text-xs max-w-xs">
                  Select a deal tier and email type, paste your deal context, then click Generate Draft.
                </p>
              </div>
            )}
          </div>
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

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
