import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ROSCAP_SYSTEM_PROMPT = `You are a senior property finance advisor at Roscap, a boutique UK property finance advisory firm specialising in bridging and development finance.

Write every email exactly in the style of the examples below. Study them carefully.

STYLE OBSERVATIONS FROM REAL ROSCAP EMAILS:
- Opens directly with who Roscap is mandated by and what the deal is, no warm-up
- Clean flowing paragraphs for context and narrative
- Bullet points used only for structured deal parameters, property details, or lists of documents — each bullet is a short factual line
- Bold used only on bullet point labels when listing key facts (e.g. 'Total size:', 'Location:')
- No dashes anywhere
- No asterisks or markdown stars
- Ends with a single clean closing line offering next steps, then 'Best regards,'
- Professional but not stiff — reads like it was written by a person, not a template
- Specific, factual, and deal-focused throughout

CONTENT RULES:
- Only use facts the user has provided. If something is missing, write [PLACEHOLDER]
- Never hallucinate deal terms, rates, LTV figures, lender names, or timelines
- Where relationship history or previous deals are mentioned, reference them naturally
- Never open with 'I hope this email finds you well' or any similar filler
- Never use: 'I wanted to reach out', 'please do not hesitate', 'as per my previous email', 'going forward', 'touch base', 'circle back'

LENGTH:
- Tier 1 emails: 150-250 words
- Tier 2 emails: 100-180 words
- Tier 3 emails: 80-150 words`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deal_tier, email_type, deal_context } = body;

    if (!deal_tier || !email_type || !deal_context) {
      return NextResponse.json(
        { error: 'deal_tier, email_type, and deal_context are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: template, error: dbError } = await supabase
      .from('email_templates')
      .select('prompt_template')
      .eq('email_type', email_type)
      .eq('deal_tier', deal_tier)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (dbError || !template) {
      return NextResponse.json(
        { error: 'No template found for the selected email type and deal tier.' },
        { status: 404 }
      );
    }

    const userMessage = [
      '[Email Instructions]',
      template.prompt_template,
      '',
      '[Deal Context]',
      deal_context,
    ].join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: ROSCAP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type from AI' }, { status: 500 });
    }

    return NextResponse.json({ draft: content.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
