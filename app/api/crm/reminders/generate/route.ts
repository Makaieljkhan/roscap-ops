import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Contact {
  id: string;
  full_name: string;
  preferred_name: string | null;
  company: string | null;
  relationship_health: string | null;
  last_deal_type: string | null;
  last_deal_size: number | null;
  last_deal_date: string | null;
  last_contact_date: string | null;
  birthday: string | null;
  pipeline_note: string | null;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function generateDraft(type: string, contact: Contact): Promise<string> {
  const name = contact.preferred_name || contact.full_name;
  const prompts: Record<string, string> = {
    anniversary: `Write a brief, warm message from Roscap to ${name} on the upcoming one-year anniversary of their ${contact.last_deal_type || 'deal'}. Suggest a catch-up call. 2–3 sentences, plain text, no filler phrases.`,
    birthday: `Write a brief, genuine birthday message from the Roscap team to ${name}. Warm and personal, not corporate. 1–2 sentences, plain text.`,
    dormancy: `Write a brief check-in message from Roscap to ${name}. It has been a while since you last spoke. Ask what they are working on. 2–3 sentences, plain text, no filler phrases.`,
    pipeline: `Write a brief follow-up message from Roscap to ${name} regarding this pipeline note: "${contact.pipeline_note}". Ask for a brief update. 2–3 sentences, plain text, no filler phrases.`,
  };

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: 'You write short, warm, professional messages on behalf of Roscap, a UK property finance advisory firm. Plain text only, no markdown, no corporate filler.',
      messages: [{ role: 'user', content: prompts[type] ?? 'Write a brief professional check-in message.' }],
    });
    const content = msg.content[0];
    return content.type === 'text' ? content.text : '';
  } catch {
    return '';
  }
}

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: contacts, error: contactsErr } = await supabase
      .from('contacts')
      .select('id,full_name,preferred_name,company,relationship_health,last_deal_type,last_deal_size,last_deal_date,last_contact_date,birthday,pipeline_note');

    if (contactsErr) return NextResponse.json({ error: contactsErr.message }, { status: 500 });
    if (!contacts || contacts.length === 0) return NextResponse.json({ created: 0 });

    // Load all existing pending reminders to avoid duplicates
    const { data: existing } = await supabase
      .from('reminders')
      .select('contact_id, reminder_type')
      .eq('status', 'pending');

    const existingSet = new Set<string>(
      (existing ?? []).map((r) => `${r.contact_id}:${r.reminder_type}`)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toCreate: Array<{
      contact_id: string;
      reminder_type: string;
      due_date: string;
      status: string;
      ai_draft_message: string;
    }> = [];

    for (const contact of contacts as Contact[]) {
      const key = (type: string) => `${contact.id}:${type}`;

      // ── Anniversary: 11 months after last_deal_date ──────────────────────
      if (contact.last_deal_date && !existingSet.has(key('anniversary'))) {
        const dealDate = new Date(contact.last_deal_date);
        const daysSince = daysBetween(dealDate, today);
        if (daysSince >= 330 && daysSince < 366) {
          const anniversaryDate = new Date(dealDate);
          anniversaryDate.setFullYear(anniversaryDate.getFullYear() + 1);
          const draft = await generateDraft('anniversary', contact);
          toCreate.push({
            contact_id: contact.id,
            reminder_type: 'anniversary',
            due_date: anniversaryDate.toISOString().split('T')[0],
            status: 'pending',
            ai_draft_message: draft,
          });
        }
      }

      // ── Birthday: 3 days before ──────────────────────────────────────────
      if (contact.birthday && !existingSet.has(key('birthday'))) {
        const bday = new Date(contact.birthday);
        let thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
        if (thisYearBday < today) {
          thisYearBday = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
        }
        const daysUntil = daysBetween(today, thisYearBday);
        if (daysUntil >= 0 && daysUntil <= 3) {
          const draft = await generateDraft('birthday', contact);
          toCreate.push({
            contact_id: contact.id,
            reminder_type: 'birthday',
            due_date: thisYearBday.toISOString().split('T')[0],
            status: 'pending',
            ai_draft_message: draft,
          });
        }
      }

      // ── Dormancy: 90 days for active, 180 days for warm ──────────────────
      if (
        contact.last_contact_date &&
        ['active', 'warm'].includes(contact.relationship_health ?? '') &&
        !existingSet.has(key('dormancy'))
      ) {
        const lastContact = new Date(contact.last_contact_date);
        const daysSince = daysBetween(lastContact, today);
        const threshold = contact.relationship_health === 'active' ? 90 : 180;
        if (daysSince >= threshold) {
          const draft = await generateDraft('dormancy', contact);
          toCreate.push({
            contact_id: contact.id,
            reminder_type: 'dormancy',
            due_date: today.toISOString().split('T')[0],
            status: 'pending',
            ai_draft_message: draft,
          });
        }
      }

      // ── Pipeline: 60 days after last_contact_date if pipeline_note set ───
      if (
        contact.pipeline_note &&
        contact.last_contact_date &&
        !existingSet.has(key('pipeline'))
      ) {
        const lastContact = new Date(contact.last_contact_date);
        const daysSince = daysBetween(lastContact, today);
        if (daysSince >= 60) {
          const draft = await generateDraft('pipeline', contact);
          toCreate.push({
            contact_id: contact.id,
            reminder_type: 'pipeline',
            due_date: today.toISOString().split('T')[0],
            status: 'pending',
            ai_draft_message: draft,
          });
        }
      }
    }

    if (toCreate.length === 0) return NextResponse.json({ created: 0 });

    const { error: insertErr } = await supabase.from('reminders').insert(toCreate);
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ created: toCreate.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
