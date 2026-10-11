import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession } from './session';

function sha256(value: string) {
  return createHash('sha256').update(value).digest();
}

/** Compara e-mail e senha com ADMIN_EMAIL / ADMIN_PASSWORD em tempo constante. */
export function checkCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  const emailOk = timingSafeEqual(
    sha256(email.trim().toLowerCase()),
    sha256(adminEmail.trim().toLowerCase())
  );
  const passwordOk = timingSafeEqual(sha256(password), sha256(adminPassword));
  return emailOk && passwordOk;
}

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}
