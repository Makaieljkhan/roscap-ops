import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

function scoreLead(data: {
  deal_size: number;
  asset_type: string | null;
  location: string | null;
  timeline: string | null;
  additional_info: string | null;
}): { priority: string; priority_reason: string } {
  const size = Number(data.deal_size) || 0;
  const asset = (data.asset_type || '').toLowerCase();
  const loc = (data.location || '').toLowerCase();
  const tl = (data.timeline || '').toLowerCase();
  const info = (data.additional_info || '').toLowerCase();

  // Disqualified — non-property
  const nonPropertyTerms = ['stocks', 'shares', 'crypto', 'forex', 'bonds', 'equities', 'pension', 'mutual fund'];
  if (nonPropertyTerms.some(t => asset.includes(t) || info.includes(t))) {
    return { priority: 'disqualified', priority_reason: 'Non-property enquiry — outside Roscap mandate.' };
  }

  // Disqualified — offshore with no UK connection
  const ukTerms = ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'london', 'manchester', 'birmingham', 'bristol', 'leeds', 'liverpool', 'edinburgh', 'glasgow'];
  const offshoreTerms = ['offshore', 'overseas', 'dubai', 'malta', 'cyprus', 'cayman', 'jersey', 'guernsey', 'isle of man', 'international'];
  const hasUK = ukTerms.some(t => loc.includes(t));
  const isOffshore = offshoreTerms.some(t => loc.includes(t) || info.includes(t));
  if (isOffshore && !hasUK) {
    return { priority: 'disqualified', priority_reason: 'Offshore deal with no clear UK connection — outside Roscap mandate.' };
  }

  // Asset type flags
  const isBridging = asset.includes('bridg');
  const isDev = asset.includes('dev') || asset.includes('development') || asset.includes('construction') || asset.includes('build');
  const isCommercial = asset.includes('commercial') || asset.includes('semi-commercial');
  const isBTL = asset.includes('btl') || asset.includes('buy to let') || asset.includes('buy-to-let');
  const isRefinance = asset.includes('refinanc') || asset.includes('remortgage') || info.includes('refinanc') || info.includes('remortgage');

  // Timeline flags
  const shortTerms = ['asap', 'urgent', 'immediate', 'week', 'as soon'];
  const isShortTimeline = shortTerms.some(t => tl.includes(t))
    || (() => { const m = tl.match(/(\d+)\s*month/); return m ? parseInt(m[1]) <= 6 : false; })();
  const isUnclearTimeline = !tl.trim()
    || ['not sure', 'unsure', 'tbd', 'unknown', 'flexible', 'no rush', 'whenever', 'sometime'].some(t => tl.includes(t));

  // Deprioritised
  if (size < 300000) {
    return { priority: 'deprioritised', priority_reason: 'Deal size below £300k minimum threshold.' };
  }
  if (isBTL && isRefinance) {
    return { priority: 'deprioritised', priority_reason: 'BTL refinance — outside Roscap core mandate.' };
  }
  if (isUnclearTimeline) {
    return { priority: 'deprioritised', priority_reason: 'Timeline unclear or not provided.' };
  }

  // Urgent
  const isPriorityLocation = loc.includes('london') || loc.includes('manchester');
  if (size >= 2000000 && (isBridging || isDev) && isPriorityLocation && isShortTimeline) {
    return {
      priority: 'urgent',
      priority_reason: `High-value ${data.asset_type} in ${data.location} — deal size, asset class, location, and timeline all qualify.`,
    };
  }

  // Standard
  if (size >= 300000 && (isBridging || isDev || isCommercial)) {
    return {
      priority: 'standard',
      priority_reason: `Qualifying ${data.asset_type} enquiry within Roscap deal parameters.`,
    };
  }

  if (size >= 300000) {
    return { priority: 'standard', priority_reason: 'Deal size meets minimum — asset class to be assessed.' };
  }

  return { priority: 'deprioritised', priority_reason: 'Does not meet Roscap minimum criteria.' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, deal_size, asset_type, location, timeline, additional_info } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    const size = parseFloat(deal_size) || 0;

    // Score the lead
    const { priority, priority_reason } = scoreLead({ deal_size: size, asset_type, location, timeline, additional_info });

    // Generate AI draft response
    let ai_draft_response = '';
    try {
      const priorityInstructions: Record<string, string> = {
        urgent: 'This is a high-priority lead. Write with urgency — propose a call today or tomorrow. Express genuine enthusiasm for the deal.',
        standard: 'This is a standard qualifying lead. Be professionally interested. Outline the next steps clearly.',
        deprioritised: 'This lead is below our typical threshold. Be polite and professional but do not overpromise. Manage expectations honestly.',
        disqualified: 'This enquiry falls outside Roscap mandate. Write a brief, polite note explaining we are unable to assist and suggesting they seek a more suitable lender.',
      };

      const draftMessage = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `You are a senior property finance advisor at Roscap, a boutique UK property finance advisory firm specialising in bridging and development finance. Write a professional follow-up email draft to an inbound enquiry. Plain text only, no markdown, no bullet points. 3-4 short paragraphs. Sign off as "Best regards, The Roscap Team". Never use filler phrases like "I hope this email finds you well", "I wanted to reach out", or "please do not hesitate".`,
        messages: [{
          role: 'user',
          content: `New inbound enquiry:

Name: ${name}
Email: ${email}
Deal Size: ${size ? formatMoney(size) : 'Not provided'}
Asset Type: ${asset_type || 'Not provided'}
Location: ${location || 'Not provided'}
Timeline: ${timeline || 'Not provided'}
Additional Info: ${additional_info || 'None'}

Priority: ${priority.toUpperCase()}
${priorityInstructions[priority]}

Write the follow-up email draft now.`,
        }],
      });

      const content = draftMessage.content[0];
      if (content.type === 'text') ai_draft_response = content.text;
    } catch (aiErr) {
      console.error('[inbound/submit] AI draft error:', aiErr);
    }

    // Save to Supabase
    const supabase = createServerSupabaseClient();
    const { data: lead, error: dbError } = await supabase
      .from('inbound_leads')
      .insert({
        name,
        email,
        phone: phone || null,
        deal_size: size || null,
        asset_type: asset_type || null,
        location: location || null,
        timeline: timeline || null,
        additional_info: additional_info || null,
        priority,
        priority_reason,
        ai_draft_response,
        status: 'new',
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Send emails via Resend (best-effort — never fail the request)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.FROM_EMAIL ?? 'Roscap <team@roscap.co.uk>';

      // Auto-acknowledgement to prospect
      try {
        await resend.emails.send({
          from,
          to: [email],
          subject: 'Thanks for your enquiry — Roscap',
          text: `Hi ${name},

Thank you for getting in touch with Roscap. We have received your enquiry regarding ${asset_type || 'property finance'} and a member of our team will be in touch with you within the hour.

If you have any additional information you would like to share in the meantime, feel free to reply directly to this email.

Best regards,
The Roscap Team`,
        });
      } catch (emailErr) {
        console.error('[inbound/submit] Auto-ack email error:', emailErr);
      }

      // Partner alert
      const partners = [process.env.PARTNER_EMAIL_1, process.env.PARTNER_EMAIL_2].filter(Boolean) as string[];
      if (partners.length > 0) {
        try {
          await resend.emails.send({
            from,
            to: partners,
            subject: `New Lead — ${name} | ${priority.toUpperCase()} | ${size ? formatMoney(size) : 'Size TBC'}`,
            text: `New inbound enquiry received.

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Deal Size: ${size ? formatMoney(size) : 'Not provided'}
Asset Type: ${asset_type || 'Not provided'}
Location: ${location || 'Not provided'}
Timeline: ${timeline || 'Not provided'}
Additional Info: ${additional_info || 'None'}

Priority: ${priority.toUpperCase()}
Reason: ${priority_reason}

────────────────────────────────────

AI DRAFT RESPONSE:

${ai_draft_response || 'Draft generation failed.'}`,
          });
        } catch (emailErr) {
          console.error('[inbound/submit] Partner alert email error:', emailErr);
        }
      }
    }

    return NextResponse.json({ success: true, lead_id: lead.id, priority }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
