import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const { lenderId, question } = await req.json();

  const { data: lender } = await supabase
    .from('lenders')
    .select('*')
    .eq('id', lenderId)
    .single();

  if (!lender) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: `You are a property finance expert helping Roscap, a UK boutique bridging and development finance advisory firm, understand their lender database. Answer questions about lenders concisely and honestly. Here is the lender profile: ${JSON.stringify(lender, null, 2)}`,
    messages: [{ role: 'user', content: question }],
  });

  const block = response.content[0];
  const answer = block.type === 'text' ? block.text : '';

  return NextResponse.json({ answer });
}
