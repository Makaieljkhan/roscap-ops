'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedName = window.localStorage.getItem('roscap-comment-author');
    if (storedName) setAuthor(storedName);
  }, []);

  useEffect(() => {
    if (!panelOpen) return;

    const body = document.body;
    const scrollEl = document.querySelector<HTMLElement>('[data-dashboard-scroll]');
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const mainScrollbarWidth = scrollEl ? scrollEl.offsetWidth - scrollEl.clientWidth : 0;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;

    body.classList.add('overflow-hidden');
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    let prevScrollOverflow = '';
    let prevScrollPaddingRight = '';
    if (scrollEl) {
      prevScrollOverflow = scrollEl.style.overflow;
      prevScrollPaddingRight = scrollEl.style.paddingRight;
      scrollEl.classList.add('overflow-hidden');
      const pad = mainScrollbarWidth > 0 ? mainScrollbarWidth : scrollbarWidth;
      if (pad > 0) {
        scrollEl.style.paddingRight = `${pad}px`;
      }
    }

    return () => {
      body.classList.remove('overflow-hidden');
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
      if (scrollEl) {
        scrollEl.classList.remove('overflow-hidden');
        scrollEl.style.overflow = prevScrollOverflow;
        scrollEl.style.paddingRight = prevScrollPaddingRight;
      }
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
      setSummary(stripMarkdown(data.summary ?? ''));
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

      {mounted &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 z-40 transition-opacity duration-300 ${panelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              aria-hidden={!panelOpen}
            >
              <button
                type="button"
                aria-label="Close panel overlay"
                className="fixed inset-0 w-full h-full bg-black/30"
                onClick={handleClose}
              />
            </div>

            <div
              role="dialog"
              aria-modal="true"
              aria-label={selectedLender ? `Notes for ${selectedLender.lender_name}` : 'Lender notes'}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '480px',
                height: '100vh',
                backgroundColor: 'white',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50,
                transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 300ms ease-out',
                willChange: 'transform',
              }}
            >
              <div style={{ padding: '24px', borderBottom: '1px solid #E8E4DC', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <h2 className="font-display text-[1.65rem] font-light leading-tight text-[#0d2b1f] pr-2">
                    {selectedLender?.lender_name ?? 'Lender Notes'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-[#8f8f8f] hover:text-[#555] transition-colors text-xl leading-none"
                    aria-label="Close comments panel"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderBottom: '1px solid #E8E4DC', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={handleSummarise}
                  disabled={!selectedLender || summaryLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-[#c9a84c] text-[#8b6e1f] hover:bg-[#fff8e5] disabled:opacity-50 transition-colors"
                >
                  {summaryLoading && (
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  AI Summarise
                </button>
                {summaryError && <p className="mt-3 text-sm text-red-600">{summaryError}</p>}
                {summary && (
                  <p className="mt-3 text-[14px] leading-relaxed text-[#3d5a4a] bg-[#F5F5F0] border-l-4 border-[#c9a84c] px-3 py-3">
                    {summary}
                  </p>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                {commentsLoading && <p className="text-sm text-[#7a9080]">Loading notes...</p>}
                {commentsError && <p className="text-sm text-red-600">{commentsError}</p>}
                {commentEmpty && (
                  <p className="text-sm text-[#7a9080] py-4">No notes yet. Add the first one below.</p>
                )}
                {comments.map((comment) => (
                  <article key={comment.id} className="py-3 border-b border-[#E8E4DC] last:border-b-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-bold text-[#0d2b1f]">{comment.author}</p>
                      <time className="text-[11px] text-[#8f8f8f] whitespace-nowrap">
                        {new Date(comment.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p className="mt-1.5 text-sm text-[#4f4f4f] whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </article>
                ))}
              </div>

              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #E8E4DC',
                  flexShrink: 0,
                  backgroundColor: 'white',
                }}
              >
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-[#3d5a4a]">Your name</label>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Suleman"
                    className="w-full h-9 px-3 text-sm text-[#0d2b1f] bg-white border border-[#E8E4DC] rounded-md focus:outline-none focus:border-[#c9a84c]"
                  />
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Add a note for this lender..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm text-[#0d2b1f] bg-white border border-[#E8E4DC] rounded-md resize-none focus:outline-none focus:border-[#c9a84c]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmitComment}
                      disabled={submitting || !author.trim() || !content.trim() || !selectedLender}
                      className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-md bg-white border border-[#E8E4DC] text-[#0d2b1f] hover:bg-[#FAF8F4] disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

/** Strip markdown so AI summaries render as plain text. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/[*#`~]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
