import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const { data: user } = await supabase
    .from('app_users')
    .select('id, display_name, role, password_hash')
    .eq('username', username.toLowerCase().trim())
    .single();

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const session = Buffer.from(
    JSON.stringify({ userId: user.id, name: user.display_name, role: user.role })
  ).toString('base64');

  const res = NextResponse.json({ ok: true, name: user.display_name });
  res.cookies.set('roscap_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}
