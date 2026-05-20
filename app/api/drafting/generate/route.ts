import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ROSCAP_SYSTEM_PROMPT = `You are a senior property finance advisor at Roscap, a boutique UK property finance advisory firm specialising in bridging and development finance. Write in a professional, direct, and confident tone. Only use the deal information provided by the user. If any information is missing, insert [PLACEHOLDER] rather than guessing or inventing details. Never hallucinate deal terms, rates, LTV figures, or lender names.

Write in a natural, human tone that does not sound AI-generated. Use dashes where a human would naturally pause or add emphasis — like this. Avoid bullet points, numbered lists, and overly structured formatting unless the email type specifically requires it. Write in flowing paragraphs as a senior finance professional would.

Where the user provides information about a recent transaction, previous deal, or relationship history with the firm or lender, reference it specifically and naturally in the email — do not write generically. The email should feel like it was written by someone who knows this client or lender personally.

Never start an email with "I hope this email finds you well" or any similar filler opener. Get to the point naturally but warmly.

Never use phrases like "I wanted to reach out", "please do not hesitate", "as per my previous email", or "going forward". These are corporate filler — avoid them entirely.`;

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
