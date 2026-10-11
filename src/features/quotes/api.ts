import { queryOptions } from '@tanstack/react-query';
import { api, qs } from '@/lib/api-client';
import type { Client, Project, Quote, QuoteItem } from '@/db/schema';
import type { QuoteInput } from './schema';

export type QuoteRow = Quote & { clientName: string | null; total: number };
export type QuoteDetail = Quote & {
  items: QuoteItem[];
  client: Client | null;
  subtotal: number;
  total: number;
};

export const quotesQuery = (filters: { search?: string; status?: string } = {}) =>
  queryOptions({
    queryKey: ['quotes', 'list', filters],
    queryFn: () => api.get<QuoteRow[]>(`/orcamentos${qs(filters)}`)
  });

export const quoteQuery = (id: number) =>
  queryOptions({
    queryKey: ['quotes', 'detail', id],
    queryFn: () => api.get<QuoteDetail>(`/orcamentos/${id}`)
  });

export const saveQuote = ({ id, values }: { id?: number; values: QuoteInput }) =>
  id ? api.put<Quote>(`/orcamentos/${id}`, values) : api.post<Quote>('/orcamentos', values);

export const deleteQuote = (id: number) => api.delete(`/orcamentos/${id}`);

export const convertQuote = (id: number) => api.post<Project>(`/orcamentos/${id}/converter`);
