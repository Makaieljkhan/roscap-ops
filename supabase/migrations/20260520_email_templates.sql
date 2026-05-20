-- Create email_templates table for Module 2 — Deal Drafting Engine
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL,
  deal_tier TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email_type, deal_tier, version)
);

-- Insert initial prompt templates: 8 email types × 3 tiers = 24 rows

INSERT INTO email_templates (email_type, deal_tier, prompt_template, version) VALUES

-- ── lender_pitch ──────────────────────────────────────────────────────────────
('lender_pitch', 'tier1',
'Write a compelling lender pitch email for a Tier 1 deal (typically £5M+ or a complex/premium transaction). This is a high-value opportunity and the email should reflect that. Structure: (1) A direct opening that names the deal and leads with the strongest credit point. (2) A concise deal summary covering loan amount, asset type, LTV, term, and exit strategy — use short bullets for parameters. (3) Why this specific lender is suited for this transaction, referencing their known appetite or any relevant activity if provided. (4) Clear next steps. Tone: senior-level, authoritative, and confident. Prose for the opening and close; structured bullets for deal parameters only. Under 300 words.',
1),

('lender_pitch', 'tier2',
'Write a professional lender pitch email for a Tier 2 deal (typically £1M–£5M, standard commercial transaction). Structure: (1) Brief introduction of the opportunity. (2) Key deal parameters as a short bulleted list — loan amount, asset type, LTV, term, exit. (3) Borrower profile summary. (4) Why you are approaching this lender. (5) Proposed next step. Tone: professional and efficient. Easy to scan quickly. Under 250 words.',
1),

('lender_pitch', 'tier3',
'Write a concise lender pitch email for a Tier 3 deal (typically under £1M, straightforward residential or light commercial). Structure: (1) One-sentence opener identifying the deal. (2) Bullet-point deal parameters — loan amount, asset, LTV, term, exit. (3) One-paragraph borrower summary. (4) Requested response or next step. Tone: efficient and transactional. Avoid lengthy preamble. Under 200 words.',
1),

-- ── client_update_terms ───────────────────────────────────────────────────────
('client_update_terms', 'tier1',
'Write a client update email informing a Tier 1 client (high-value, sophisticated borrower) that lender terms have been received. Structure: (1) Clear opening statement that terms have come in. (2) Structured presentation of key term sheet parameters — rate, LTV, arrangement fee, exit fee, term, and any conditions. (3) Advisory commentary: what is strong, what to watch, and comparative notes if multiple term sheets are referenced. (4) Recommended next steps and timelines. Tone: trusted adviser, not just a data relay — the client expects strategic guidance. Under 350 words.',
1),

('client_update_terms', 'tier2',
'Write a professional client update email informing a Tier 2 client that lender terms have been received. Include: (1) Clear confirmation terms have arrived. (2) Structured bullet-point summary of key terms — rate, LTV, fees, term, conditions. (3) Short advisory note on key considerations. (4) Next steps. Tone: professional and helpful. Under 280 words.',
1),

('client_update_terms', 'tier3',
'Write a concise client update email informing a Tier 3 client that lender terms have been received. Cover: (1) Terms received and from which lender. (2) Bullet-point summary of key terms. (3) What happens next and any actions required from the client. Tone: clear and direct. Under 200 words.',
1),

-- ── client_update_dd ──────────────────────────────────────────────────────────
('client_update_dd', 'tier1',
'Write a client update email informing a Tier 1 client about the current status of due diligence. This client expects proactive, detailed communication. Structure: (1) Clear DD status summary — where things stand overall. (2) Outstanding items with clarity on who owns each one: solicitors, valuers, accountants, the client, or Roscap. (3) Items on the critical path or causing delay. (4) Updated timeline estimate where appropriate. (5) Clear actions required from the client. Tone: proactive, organised, and advisory. Under 350 words.',
1),

('client_update_dd', 'tier2',
'Write a professional client update email on due diligence progress for a Tier 2 deal. Include: (1) Overall DD status. (2) Outstanding items and who owns them. (3) Any issues or delays. (4) Expected timeline. (5) Actions needed from the client. Tone: clear and organised. Under 280 words.',
1),

('client_update_dd', 'tier3',
'Write a concise due diligence update email for a Tier 3 client. Cover the key outstanding items, who needs to action them, and the expected timeline. Tone: direct and action-focused. Under 180 words.',
1),

-- ── lender_followup ───────────────────────────────────────────────────────────
('lender_followup', 'tier1',
'Write a follow-up email to a lender regarding a Tier 1 deal (high-value transaction). Structure: (1) Brief re-introduction of the deal if appropriate. (2) The specific item being followed up on — e.g., indicative terms, credit approval, or legal instructions. (3) Any updated information or deal development since last contact. (4) Clear ask with a specific timeframe. Tone: polite but direct; senior-level language. Avoid anything that sounds chasing or desperate. Under 220 words.',
1),

('lender_followup', 'tier2',
'Write a professional follow-up email to a lender on a Tier 2 deal. Reference the original submission, state what you are following up on, note any relevant updates, and make a clear ask with a timeframe. Tone: courteous and professional. Under 180 words.',
1),

('lender_followup', 'tier3',
'Write a brief follow-up email to a lender on a Tier 3 deal. State the deal you are following up on, what you need, and by when. Tone: direct and efficient. Under 120 words.',
1),

-- ── deal_declined ─────────────────────────────────────────────────────────────
('deal_declined', 'tier1',
'Write an email informing a Tier 1 client (valued, sophisticated borrower) that a lender has declined their deal. This requires careful, empathetic handling while maintaining confidence. Structure: (1) Deliver the decline clearly and without ambiguity. (2) Briefly explain the lender''s stated reason if known. (3) Roscap''s perspective — is this lender-specific or a wider market issue? (4) Alternative approaches or next steps — other lenders, restructuring options, or timeline adjustments. (5) Reassurance of continued support. Tone: empathetic, strategic, and confident. Do not be apologetic or overly negative. Under 320 words.',
1),

('deal_declined', 'tier2',
'Write a professional email informing a Tier 2 client of a lender decline. Cover: the decline, the reason if known, Roscap''s recommended next steps, and reassurance that the process continues. Tone: professional and constructive. Under 250 words.',
1),

('deal_declined', 'tier3',
'Write a concise email informing a Tier 3 client that a lender has declined their deal. State the outcome, brief reason if available, and the proposed next step. Tone: clear and constructive. Under 180 words.',
1),

-- ── completion_congratulations ────────────────────────────────────────────────
('completion_congratulations', 'tier1',
'Write a completion congratulations email to a Tier 1 client on the successful completion of their transaction. This is a relationship-building moment — it should feel warm and genuine, not generic. Structure: (1) Sincere congratulation that references the specific deal. (2) Brief acknowledgment of the journey and any notable aspects of the transaction. (3) Express gratitude for the client''s trust and collaboration. (4) Look ahead — future projects, refinance timing, or simply keeping in touch. (5) Warm close. Tone: warm, personal, and polished — from a trusted adviser, not a transactional service provider. Under 280 words.',
1),

('completion_congratulations', 'tier2',
'Write a professional completion congratulations email to a Tier 2 client. Congratulate them on completing, reference the deal briefly, thank them for working with Roscap, and mention staying in touch for future needs. Tone: warm but professional. Under 200 words.',
1),

('completion_congratulations', 'tier3',
'Write a brief completion congratulations email for a Tier 3 client. Keep it warm, concise, and genuine. Congratulate them, reference the deal, and invite them back for future projects. Under 150 words.',
1),

-- ── intro_new_lender ──────────────────────────────────────────────────────────
('intro_new_lender', 'tier1',
'Write an introductory email presenting a new lender to a Tier 1 client as a potential funding partner. This client is sophisticated and expects substantive reasoning, not just a name drop. Structure: (1) Context — why you are introducing this lender now (pricing advantage, specific appetite, speed of execution). (2) Substantive lender profile — who they are, what they specialise in, and what makes them relevant to this deal. (3) Indicative terms or appetite signals if known. (4) Proposed next steps — call, introduction, or submitting a credit pack. Tone: advisory, informed, and professional. Under 300 words.',
1),

('intro_new_lender', 'tier2',
'Write a professional email introducing a new lender to a Tier 2 client. Cover who the lender is, why they are relevant to the deal, any indicative terms if known, and suggested next steps. Tone: helpful and professional. Under 230 words.',
1),

('intro_new_lender', 'tier3',
'Write a concise email introducing a new lender option to a Tier 3 client. Briefly explain who the lender is and why they might be suitable. Tone: clear and direct. Under 160 words.',
1),

-- ── repeat_client_checkin ─────────────────────────────────────────────────────
('repeat_client_checkin', 'tier1',
'Write a relationship check-in email to a Tier 1 repeat client. This is proactive outreach — there may not be a live deal — designed to maintain the relationship and surface new opportunities. Structure: (1) Warm, genuine acknowledgment of the relationship and any recent context if provided. (2) Reference their last deal or project to show continuity of care. (3) Express genuine interest in what they are working on or planning next. (4) Offer a specific value-add — market intelligence, a new lender relationship, or a catch-up call. (5) Low-friction next step. Tone: warm, relationship-first, non-salesy. This should feel like a message from a trusted adviser, not a business development call. Under 280 words.',
1),

('repeat_client_checkin', 'tier2',
'Write a professional check-in email to a Tier 2 repeat client. Reference the previous deal, ask about upcoming projects, and offer Roscap''s support for future needs. Tone: friendly and professional. Under 200 words.',
1),

('repeat_client_checkin', 'tier3',
'Write a brief check-in email to a Tier 3 repeat client. Acknowledge the previous work, ask if they have anything coming up, and invite them to get in touch. Tone: warm and concise. Under 140 words.',
1);
