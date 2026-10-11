// Sessão via JWT (jose) em cookie httpOnly. Compatível com o proxy e as API routes.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export type Session = { email: string; name: string };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET ausente ou curto (mín. 32)');
  return new TextEncoder().encode(value);
}

export async function signSession(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { email: String(payload.email), name: String(payload.name) };
  } catch {
    return null;
  }
}
