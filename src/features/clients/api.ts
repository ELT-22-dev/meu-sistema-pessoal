import { queryOptions } from '@tanstack/react-query';
import { api, qs } from '@/lib/api-client';
import type { Client, Project, Quote, Transaction } from '@/db/schema';
import type { ClientInput } from './schema';

export type ClientRow = Client & { projectCount: number; received: number };
export type ClientDetail = Client & {
  projects: (Project & { received: number })[];
  quotes: (Quote & { total: number })[];
  transactions: Transaction[];
};

export const clientKeys = {
  all: ['clients'] as const,
  list: (search: string) => ['clients', 'list', search] as const,
  detail: (id: number) => ['clients', 'detail', id] as const
};

export const clientsQuery = (search = '') =>
  queryOptions({
    queryKey: clientKeys.list(search),
    queryFn: () => api.get<ClientRow[]>(`/clientes${qs({ search })}`)
  });

export const clientQuery = (id: number) =>
  queryOptions({
    queryKey: clientKeys.detail(id),
    queryFn: () => api.get<ClientDetail>(`/clientes/${id}`)
  });

export const saveClient = ({ id, values }: { id?: number; values: ClientInput }) =>
  id ? api.put<Client>(`/clientes/${id}`, values) : api.post<Client>('/clientes', values);

export const deleteClient = (id: number) => api.delete(`/clientes/${id}`);

/** Opções de cliente para selects (inclui "Sem cliente"). */
export function clientOptions(clients: Pick<Client, 'id' | 'name' | 'company'>[] | undefined) {
  return [
    { value: '', label: 'Sem cliente' },
    ...(clients ?? []).map((c) => ({
      value: String(c.id),
      label: c.company ? `${c.name} — ${c.company}` : c.name
    }))
  ];
}

/** Link do WhatsApp a partir do telefone (assume Brasil se vier sem DDI). */
export function whatsappLink(phone: string | null | undefined) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}
