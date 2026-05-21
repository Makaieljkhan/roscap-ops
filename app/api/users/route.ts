import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getSession() {
  const cookie = cookies().get('roscap_session')?.value;
  if (!cookie) return null;
  try {
    return JSON.parse(Buffer.from(cookie, 'base64').toString()) as {
      userId: string;
      name: string;
      role: string;
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { data } = await supabase
    .from('app_users')
    .select('id, username, display_name, role, created_at')
    .order('created_at');
  return NextResponse.json({ users: data });
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { username, display_name, password, role } = await req.json();
  if (!username || !display_name || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const { error } = await supabase.from('app_users').insert({
    username: username.toLowerCase(),
    display_name,
    password_hash,
    role: role || 'user',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await req.json();
  await supabase.from('app_users').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
