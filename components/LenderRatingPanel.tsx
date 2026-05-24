'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, SectionTitle } from '@/components/ui';
import type { Lender } from '@/types';

function scoreColor(score: number) {
  if (score >= 7) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export default function LenderRatingPanel({ lender }: { lender: Lender }) {
  const router = useRouter();
  const displayScore = lender.ai_score_override ?? lender.ai_score;

  const [score, setScore] = useState<number | null>(lender.ai_score);
  const [rationale, setRationale] = useState(lender.ai_score_rationale ?? '');
  const [override, setOverride] = useState(
    lender.ai_score_override != null ? String(lender.ai_score_override) : ''
  );
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [rating, setRating] = useState(false);
  const [asking, setAsking] = useState(false);
  const [savingOverride, setSavingOverride] = useState(false);

  async function handleRate() {
    setRating(true);
    try {
      const res = await fetch('/api/lenders/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lenderId: lender.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScore(data.score);
      setRationale(data.rationale);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rating failed');
    } finally {
      setRating(false);
    }
  }

  async function saveOverride() {
    setSavingOverride(true);
    try {
      const val = override === '' ? null : Number(override);
      const res = await fetch(`/api/lenders/${lender.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_score_override: val }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingOverride(false);
    }
  }

  async function handleAsk() {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer('');
    try {
      const res = await fetch('/api/lenders/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lenderId: lender.id, question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnswer(data.answer);
    } catch (err) {
      setAnswer(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setAsking(false);
    }
  }

  const shown = lender.ai_score_override ?? score ?? displayScore;

  return (
    <Card className="sticky top-8">
      <SectionTitle>AI Lender Rating</SectionTitle>

      {shown != null ? (
        <div className="text-center mb-5">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border-2 font-display text-4xl font-light ${scoreColor(shown)}`}
          >
            {shown.toFixed(1)}
          </div>
          {lender.ai_score_override != null && (
            <p className="text-xs text-[#7a9080] mt-2">Manual override active</p>
          )}
          {rationale && (
            <p className="text-sm text-[#7a9080] mt-3 leading-relaxed">{rationale}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#7a9080] mb-5 text-center">No AI score yet. Rate this lender to get started.</p>
      )}

      <Button onClick={handleRate} loading={rating} variant="gold" className="w-full mb-5">
        Re-rate with AI
      </Button>

      <div className="space-y-3 mb-5">
        <Input
          label="Override Score"
          type="number"
          min={0}
          max={10}
          step={0.1}
          placeholder="0–10"
          value={override}
          onChange={(e) => setOverride(e.target.value)}
          hint="Leave blank to use AI score only"
        />
        <Button onClick={saveOverride} loading={savingOverride} variant="ghost" size="sm" className="w-full">
          Save Override
        </Button>
      </div>

      <div className="border-t border-[#ddd6c8] pt-5 space-y-3">
        <p className="text-xs font-semibold text-[#3d5a4a] uppercase tracking-wider">Ask about this lender</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Why is the score low?"
            className="flex-1 bg-white border border-[#ddd6c8] rounded-lg px-3 py-2 text-sm text-[#0d2b1f] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/15"
          />
          <Button onClick={handleAsk} loading={asking} size="sm">
            Send
          </Button>
        </div>
        {answer && (
          <div className="bg-[#f5f0e8] border border-[#ddd6c8] rounded-lg p-4 text-sm text-[#3d5a4a] leading-relaxed">
            {answer}
          </div>
        )}
      </div>
    </Card>
  );
}
