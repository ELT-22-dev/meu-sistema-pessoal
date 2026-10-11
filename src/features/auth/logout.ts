export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
  window.location.href = '/login';
}
