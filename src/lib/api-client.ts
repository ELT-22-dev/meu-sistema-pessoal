const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `Erro ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => apiClient<T>(url),
  post: <T>(url: string, body?: unknown) =>
    apiClient<T>(url, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: <T>(url: string, body: unknown) =>
    apiClient<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    apiClient<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => apiClient<T>(url, { method: 'DELETE' })
};

/** Monta a query string ignorando valores vazios. */
export function qs(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

/** Mensagem amigável de um erro de mutation. */
export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Algo deu errado. Tente de novo.';
