import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { Lender, LenderMatchResult } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a property finance specialist assistant for Roscap, an internal advisory platform. You will be provided with a JSON array of lender records from our database, only use these records, do not use any knowledge of lenders from your training data.

Each lender record has the following key fields:
- lender_name / common_name: the lender's identity
- asset_class_appetite: array of asset types the lender will fund
- geography: free-text description of where the lender operates
- deal_size_min / deal_size_max: the lender's acceptable deal size range (in dollars)
- ltv_standard: the standard LTV ceiling the lender will go to
- ltv_stretch: the maximum LTV the lender will consider on a stretch basis
- rate_range_low / rate_range_high: indicative rate range (%)
- arrangement_fee / exit_fee: fee structure
- turnaround_speed: indicative timeline from enquiry to formal approval
- current_status: 'hungry' = actively deploying, 'selective' = case-by-case, 'quiet' = limited appetite, 'changing' = policy in flux
- key_contacts: BDM and relationship contacts
- recent_deal_experience: recent transactions and deal types
- suleman_notes: proprietary intelligence and relationship notes

Matching rules:
1. Exclude lenders where deal_size_min > requested deal_size (if deal_size_min is set)
2. Exclude lenders where deal_size_max < requested deal_size (if deal_size_max is set)
3. Exclude lenders where ltv_standard < requested ltv AND ltv_stretch < requested ltv (if either is set)
4. Apply judgment on asset_class_appetite — if a lender's appetite clearly excludes the requested asset class, exclude them
5. Apply judgment on geography — if a lender clearly does not operate in the requested geography, exclude them

Scoring guidance (0–100):
- current_status 'hungry' adds ~15 points vs 'selective', 'quiet' deducts ~20, 'changing' deducts ~10
- LTV headroom above the request is a positive signal
- Rate competitiveness relative to other matching lenders matters
- Rich recent_deal_experience in the same asset class adds confidence
- Relationship notes in suleman_notes suggesting strong rapport are a positive signal

Return a JSON object with exactly this structure — no markdown, no commentary, raw JSON only:
{
  "matches": [
    {
      "lender_id": "string (the lender's id field)",
      "match_score": number (0-100),
      "reasoning": "2-3 sentence explanation referencing specific fields from the record",
      "caveats": ["array of strings — policy conditions, things to verify, risks to flag"]
    }
  ],
  "summary": "1-2 sentence plain-English overview of the matching results and recommended next steps"
}

Order matches by match_score descending. Only include lenders that are genuinely suitable. If no lenders qualify, return an empty matches array with an explanatory summary.`;

interface AIMatch {
  lender_id: string;
  match_score: number;
  reasoning: string;
  caveats: string[];
}

interface AIResponse {
  matches: AIMatch[];
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deal_size, asset_class, ltv, geography, additional_notes } = body;

    if (!deal_size || !asset_class || !ltv) {
      return NextResponse.json(
        { error: 'deal_size, asset_class, and ltv are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: lenders, error: dbError } = await supabase
      .from('lenders')
      .select('*')
      .order('lender_name');

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!lenders || lenders.length === 0) {
      return NextResponse.json(
        { matches: [], summary: 'No lenders are currently in the database.' },
        { status: 200 }
      );
    }

    const userMessage = [
      `Lender records (${lenders.length} total):`,
      JSON.stringify(lenders, null, 2),
      '',
      'Deal requirements:',
      JSON.stringify({ deal_size, asset_class, ltv, geography, additional_notes }, null, 2),
    ].join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type from AI' }, { status: 500 });
    }

    const rawText = content.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');

    let aiResponse: AIResponse;
    try {
      aiResponse = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      );
    }

    const lenderMap = new Map<string, Lender>(lenders.map((l: Lender) => [l.id, l]));

    const enrichedMatches: LenderMatchResult[] = aiResponse.matches
      .map((match: AIMatch) => ({
        lender: lenderMap.get(match.lender_id)!,
        match_score: match.match_score,
        reasoning: match.reasoning,
        caveats: match.caveats ?? [],
      }))
      .filter((m: LenderMatchResult) => m.lender != null);

    return NextResponse.json({
      matches: enrichedMatches,
      summary: aiResponse.summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
