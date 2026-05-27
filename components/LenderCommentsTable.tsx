'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DeleteLenderButton from '@/components/DeleteLenderButton';
import LenderScoreCell from '@/components/LenderScoreCell';
import type { Lender } from '@/types';
import { LENDER_STATUS_LABELS, LENDER_STATUS_COLORS } from '@/types';

interface LenderComment {
  id: string;
  lender_id: string;
  author: string;
  content: string;
  created_at: string;
}

interface Props {
  lenders: Lender[];
  deleteAction: (formData: FormData) => Promise<void>;
}

export default function LenderCommentsTable({ lenders, deleteAction }: Props) {
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [comments, setComments] = useState<LenderComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const panelOpen = Boolean(selectedLender);

  useEffect(() => {
    const storedName = window.localStorage.getItem('roscap-comment-author');
    if (storedName) setAuthor(storedName);
  }, []);

  useEffect(() => {
    window.document.body.style.overflow = panelOpen ? 'hidden' : '';
    return () => {
      window.document.body.style.overflow = '';
    };
  }, [panelOpen]);

  async function loadComments(lenderId: string) {
    setCommentsLoading(true);
    setCommentsError('');
    try {
      const res = await fetch(`/api/lenders/${lenderId}/comments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load notes');
      setComments(data.comments ?? []);
    } catch (err: unknown) {
      setCommentsError(err instanceof Error ? err.message : 'Failed to load notes');
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }

  function handleOpen(lender: Lender) {
    setSelectedLender(lender);
    setSummary('');
    setSummaryError('');
    setContent('');
    void loadComments(lender.id);
  }

  function handleClose() {
    setSelectedLender(null);
    setComments([]);
    setCommentsError('');
    setSummary('');
    setSummaryError('');
    setContent('');
  }

  async function handleSummarise() {
    if (!selectedLender) return;
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await fetch(`/api/lenders/${selectedLender.id}/summarise`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate summary');
      setSummary(data.summary ?? '');
    } catch (err: unknown) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to generate summary');
      setSummary('');
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleSubmitComment() {
    if (!selectedLender || !author.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lenders/${selectedLender.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: author.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save note');
      window.localStorage.setItem('roscap-comment-author', author.trim());
      setComments((prev) => [...prev, data.comment]);
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const commentEmpty = useMemo(
    () => !commentsLoading && comments.length === 0 && !commentsError,
    [commentsLoading, comments.length, commentsError]
  );

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Score</th>
              <th>Lender</th>
              <th>Status</th>
              <th>Asset Classes</th>
              <th>Deal Size</th>
              <th>LTV</th>
              <th>Rate</th>
              <th>Geography</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lenders.map((lender) => (
              <tr
                key={lender.id}
                onClick={() => handleOpen(lender)}
                className="cursor-pointer hover:bg-[#f5f0e8]/60 transition-colors"
              >
                <td>
                  <LenderScoreCell lender={lender} />
                </td>
                <td>
                  <p className="font-medium text-[#0d2b1f]">{lender.lender_name}</p>
                  {lender.common_name && lender.common_name !== lender.lender_name && (
                    <p className="text-xs text-[#7a9080] mt-0.5">{lender.common_name}</p>
                  )}
                </td>
                <td>
                  {lender.current_status ? (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LENDER_STATUS_COLORS[lender.current_status]}`}
                    >
                      {LENDER_STATUS_LABELS[lender.current_status]}
                    </span>
                  ) : (
                    <span className="text-xs text-[#aaa]">—</span>
                  )}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {lender.asset_class_appetite.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="text-xs bg-[#f5f0e8] text-[#3d5a4a] border border-[#ddd6c8] px-2 py-0.5 rounded-full whitespace-nowrap"
                      >
                        {a}
                      </span>
                    ))}
                    {lender.asset_class_appetite.length > 3 && (
                      <span className="text-xs text-[#7a9080]">+{lender.asset_class_appetite.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="text-[#3d5a4a] whitespace-nowrap">
                  {lender.deal_size_min != null || lender.deal_size_max != null ? (
                    <>
                      {lender.deal_size_min != null ? formatMoney(lender.deal_size_min) : '—'}
                      {' – '}
                      {lender.deal_size_max != null ? formatMoney(lender.deal_size_max) : '—'}
                    </>
                  ) : (
                    <span className="text-[#aaa]">—</span>
                  )}
                </td>
                <td className="text-[#3d5a4a] whitespace-nowrap">
                  {lender.ltv_standard != null ? (
                    <>
                      {lender.ltv_standard}%
                      {lender.ltv_stretch != null && (
                        <span className="text-[#7a9080] text-xs"> / {lender.ltv_stretch}%</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[#aaa]">—</span>
                  )}
                </td>
                <td className="text-[#3d5a4a] whitespace-nowrap">
                  {lender.rate_range_low != null || lender.rate_range_high != null ? (
                    <>
                      {lender.rate_range_low ?? '—'}–{lender.rate_range_high ?? '—'}%
                    </>
                  ) : (
                    <span className="text-[#aaa]">—</span>
                  )}
                </td>
                <td className="text-[#3d5a4a] max-w-[140px] truncate">
                  {lender.geography ?? <span className="text-[#aaa]">—</span>}
                </td>
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/dashboard/lenders/${lender.id}/edit`}
                      className="text-xs text-[#7a9080] hover:text-[#0d2b1f] transition-colors"
                    >
                      Edit
                    </Link>
                    <DeleteLenderButton
                      lenderId={lender.id}
                      lenderName={lender.lender_name}
                      deleteAction={deleteAction}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${panelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          aria-label="Close panel overlay"
          className="absolute inset-0 bg-[#0b1612]/50 backdrop-blur-[1px]"
          onClick={handleClose}
        />
      </div>

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-xl bg-[#0e1c17] border-l border-[#1e3328] shadow-2xl transition-transform duration-300 ease-out ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-5 border-b border-[#1e3328] flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-light italic text-[#f0ebe0]">
                {selectedLender?.lender_name ?? 'Lender Notes'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-[#4a7060] hover:text-[#c9a84c] transition-colors text-xl leading-none"
              aria-label="Close comments panel"
            >
              ×
            </button>
          </div>

          <div className="px-6 pt-5 pb-4 border-b border-[#1e3328]">
            <button
              onClick={handleSummarise}
              disabled={!selectedLender || summaryLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#c9a84c] text-[#0b1612] hover:bg-[#e2c47a] disabled:opacity-50 transition-all"
            >
              {summaryLoading && (
                <span className="w-3.5 h-3.5 border-2 border-[#0b1612] border-t-transparent rounded-full animate-spin" />
              )}
              AI Summarise
            </button>
            {summaryError && <p className="mt-3 text-sm text-red-300">{summaryError}</p>}
            {summary && (
              <p className="mt-3 text-sm leading-relaxed text-[#d6e0d9] bg-[#132019] border border-[#1e3328] rounded-lg p-3">
                {summary}
              </p>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-3">
            {commentsLoading && <p className="text-sm text-[#4a7060]">Loading notes...</p>}
            {commentsError && <p className="text-sm text-red-300">{commentsError}</p>}
            {commentEmpty && (
              <p className="text-sm text-[#4a7060]">No notes yet. Add the first one below.</p>
            )}
            {comments.map((comment) => (
              <article
                key={comment.id}
                className="bg-[#132019] border border-[#1e3328] rounded-lg px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
                    {comment.author}
                  </p>
                  <time className="text-xs text-[#4a7060]">
                    {new Date(comment.created_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="text-sm text-[#d6e0d9] whitespace-pre-wrap">{comment.content}</p>
              </article>
            ))}
          </div>

          <div className="border-t border-[#1e3328] px-6 py-4 bg-[#0b1612]">
            <div className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a note for this lender..."
                rows={4}
                className="w-full bg-[#132019] border border-[#1e3328] rounded-lg px-3 py-2.5 text-sm text-[#f0ebe0] placeholder:text-[#4a7060] focus:outline-none focus:border-[#c9a84c]/50 resize-none"
              />
              <div className="flex items-center gap-3">
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 bg-[#132019] border border-[#1e3328] rounded-lg px-3 py-2 text-sm text-[#f0ebe0] placeholder:text-[#4a7060] focus:outline-none focus:border-[#c9a84c]/50"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !author.trim() || !content.trim() || !selectedLender}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#c9a84c] text-[#0b1612] hover:bg-[#e2c47a] disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}
