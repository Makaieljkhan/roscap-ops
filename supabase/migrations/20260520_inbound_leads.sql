-- Create inbound_leads table for Module 4 — Inbound Handler
CREATE TABLE IF NOT EXISTS inbound_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT,
  email TEXT,
  phone TEXT,
  deal_size NUMERIC,
  asset_type TEXT,
  location TEXT,
  timeline TEXT,
  additional_info TEXT,
  priority TEXT CHECK (priority IN ('urgent', 'standard', 'deprioritised', 'disqualified')),
  priority_reason TEXT,
  ai_draft_response TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'rejected'))
);
