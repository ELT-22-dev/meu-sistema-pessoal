import { queryOptions } from '@tanstack/react-query';
import { api, qs } from '@/lib/api-client';
import { todayISO } from '@/lib/format';
import type { SewingEntry, SewingModel, SewingPayment } from '@/db/schema';
import type { SewingEntryInput, SewingModelInput, SewingPaymentInput } from './schema';

export type SewingModelRow = SewingModel & { totalPieces: number; lastUsed: string | null };
export type SewingEntryRow = SewingEntry & { modelName: string; total: number };

type Totals = { pieces: number; value: number; days: number };
export type SewingSummary = {
  today: Totals;
  week: Totals;
  month: Totals;
  produced: number;
  paid: number;
  balance: number;
  lastPayment: { date: string; amount: number } | null;
  series: { date: string; pieces: number; value: number }[];
  byModel: { id: number; name: string; pieces: number; value: number }[];
};

export const sewingModelsQuery = () =>
  queryOptions({
    queryKey: ['sewing', 'models'],
    queryFn: () => api.get<SewingModelRow[]>('/costura/modelos')
  });

export const sewingEntriesQuery = (filters: { from?: string; to?: string } = {}) =>
  queryOptions({
    queryKey: ['sewing', 'entries', filters],
    queryFn: () => api.get<SewingEntryRow[]>(`/costura/producao${qs(filters)}`)
  });

export const sewingPaymentsQuery = () =>
  queryOptions({
    queryKey: ['sewing', 'payments'],
    queryFn: () => api.get<SewingPayment[]>('/costura/pagamentos')
  });

export const sewingSummaryQuery = () =>
  queryOptions({
    queryKey: ['sewing', 'summary', todayISO()],
    queryFn: () => api.get<SewingSummary>(`/costura/resumo${qs({ today: todayISO() })}`)
  });

export const saveSewingModel = ({ id, values }: { id?: number; values: SewingModelInput }) =>
  id
    ? api.put<SewingModel>(`/costura/modelos/${id}`, values)
    : api.post<SewingModel>('/costura/modelos', values);
export const deleteSewingModel = (id: number) => api.delete(`/costura/modelos/${id}`);

export const saveSewingEntry = ({ id, values }: { id?: number; values: SewingEntryInput }) =>
  id
    ? api.put<SewingEntry>(`/costura/producao/${id}`, values)
    : api.post<SewingEntry>('/costura/producao', values);
export const deleteSewingEntry = (id: number) => api.delete(`/costura/producao/${id}`);

export const saveSewingPayment = ({ id, values }: { id?: number; values: SewingPaymentInput }) =>
  id
    ? api.put<SewingPayment>(`/costura/pagamentos/${id}`, values)
    : api.post<SewingPayment>('/costura/pagamentos', values);
export const deleteSewingPayment = (id: number) => api.delete(`/costura/pagamentos/${id}`);
