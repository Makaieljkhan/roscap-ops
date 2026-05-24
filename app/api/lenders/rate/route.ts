import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const { lenderId } = await req.json();

  const { data: lender } = await supabase
    .from('lenders')
    .select('*')
    .eq('id', lenderId)
    .single();

  if (!lender) return NextResponse.json({ error: 'Lender not found' }, { status: 404 });

  const prompt = `You are a property finance expert rating lenders for a boutique UK advisory firm called Roscap that specialises in bridging and development finance.

Rate this lender out of 10 based on how valuable they are as a lending partner for Roscap's deal flow (UK bridging and development finance, deal sizes £300k–£15M+).

Lender profile:
${JSON.stringify(lender, null, 2)}

Scoring criteria:
- Current status: Hungry = higher score, Quiet/Changing = lower
- Asset class breadth: more relevant classes (bridging, dev finance, commercial) = higher
- Deal size range: covers Roscap's typical range (£300k–£15M) = higher
- LTV generosity: higher LTV limits = higher score
- Rate competitiveness: lower rates = higher score
- Quality of notes/intelligence: more detailed = higher
- Recent deal experience: positive experiences = higher

Respond ONLY with valid JSON in this exact format, nothing else:
{"score": 7.5, "rationale": "One clear sentence explaining the score"}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  const text = block.type === 'text' ? block.text.trim() : '';

  let parsed: { score: number; rationale: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  await supabase
    .from('lenders')
    .update({
      ai_score: parsed.score,
      ai_score_rationale: parsed.rationale,
    })
    .eq('id', lenderId);

  return NextResponse.json({ score: parsed.score, rationale: parsed.rationale });
}
