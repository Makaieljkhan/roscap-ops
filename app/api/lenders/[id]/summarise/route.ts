import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: lender, error: lenderError } = await supabase
      .from('lenders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (lenderError || !lender) {
      return NextResponse.json({ error: lenderError?.message ?? 'Lender not found' }, { status: 404 });
    }

    const { data: comments, error: commentsError } = await supabase
      .from('lender_comments')
      .select('author,content,created_at')
      .eq('lender_id', params.id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 500 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 220,
      system:
        'You are an intelligence assistant for Roscap, a UK property finance advisory firm. You will be given structured data about a lender from our internal database plus notes from our team. Summarise the lender\'s current appetite, best-fit deal profile, and any important flags from recent notes. Write in 3-4 concise sentences. Only use the data provided. Do not use any knowledge of lenders from your training data.',
      messages: [
        {
          role: 'user',
          content: `Lender record:\n${JSON.stringify(lender, null, 2)}\n\nTeam notes:\n${JSON.stringify(comments ?? [], null, 2)}`,
        },
      ],
    });

    const block = response.content[0];
    const summary = block.type === 'text' ? block.text.trim() : '';

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
