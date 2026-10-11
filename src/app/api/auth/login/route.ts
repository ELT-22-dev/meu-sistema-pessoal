import { NextRequest, NextResponse } from 'next/server';
import * as z from 'zod';
import { checkCredentials } from '@/lib/auth';
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from '@/lib/session';

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !checkCredentials(parsed.data.email, parsed.data.password)) {
    // Atraso fixo para dificultar força bruta.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 401 });
  }

  const token = await signSession({
    email: parsed.data.email.trim().toLowerCase(),
    name: process.env.ADMIN_NAME ?? 'Admin'
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });
  return response;
}
