import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('lender_comments')
      .select('id,lender_id,author,content,created_at')
      .eq('lender_id', params.id)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comments: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const author = typeof body.author === 'string' ? body.author.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!author || !content) {
      return NextResponse.json({ error: 'Author and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('lender_comments')
      .insert({
        lender_id: params.id,
        author,
        content,
      })
      .select('id,lender_id,author,content,created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
