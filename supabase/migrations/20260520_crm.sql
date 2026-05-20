-- Module 3 — Lightweight CRM

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  company TEXT,
  contact_type TEXT CHECK (contact_type IN ('client', 'introducer', 'lender')),
  email TEXT,
  phone TEXT,
  last_deal_type TEXT,
  last_deal_size NUMERIC,
  last_deal_date DATE,
  last_contact_date DATE,
  birthday DATE,
  pipeline_note TEXT,
  deal_tier_preference TEXT,
  relationship_health TEXT DEFAULT 'active' CHECK (relationship_health IN ('active', 'warm', 'at_risk', 'dormant')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('anniversary', 'birthday', 'dormancy', 'pipeline')),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  ai_draft_message TEXT
);
