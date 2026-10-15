import { queryOptions } from '@tanstack/react-query';
import { api, qs } from '@/lib/api-client';
import { addDaysISO, todayISO, toDate } from '@/lib/format';
import type { HaircutEntry, HaircutPayment, HaircutService } from '@/db/schema';
import type { HaircutEntryInput, HaircutPaymentInput, HaircutServiceInput } from './schema';

export type HaircutServiceRow = HaircutService & { totalCuts: number };
export type HaircutEntryRow = HaircutEntry & { serviceName: string; total: number; mine: number };
export type HaircutSummary = {
  month: { cuts: number; gross: number; mine: number; days: number };
  earned: number;
  paid: number;
  balance: number;
  lastPayment: { date: string; amount: number } | null;
  byService: { id: number; name: string; cuts: number; mine: number }[];
};

/** Sábado mais recente (hoje, se for sábado) — dia padrão do lançamento. */
export function lastSaturday(base = todayISO()) {
  const diff = (toDate(base).getDay() + 1) % 7;
  return addDaysISO(base, -diff);
}

export const haircutServicesQuery = () =>
  queryOptions({
    queryKey: ['haircut', 'services'],
    queryFn: () => api.get<HaircutServiceRow[]>('/cabeleireiro/servicos')
  });

export const haircutEntriesQuery = (filters: { from?: string; to?: string } = {}) =>
  queryOptions({
    queryKey: ['haircut', 'entries', filters],
    queryFn: () => api.get<HaircutEntryRow[]>(`/cabeleireiro/cortes${qs(filters)}`)
  });

export const haircutPaymentsQuery = () =>
  queryOptions({
    queryKey: ['haircut', 'payments'],
    queryFn: () => api.get<HaircutPayment[]>('/cabeleireiro/pagamentos')
  });

export const haircutSummaryQuery = () =>
  queryOptions({
    queryKey: ['haircut', 'summary', todayISO()],
    queryFn: () => api.get<HaircutSummary>(`/cabeleireiro/resumo${qs({ today: todayISO() })}`)
  });

export const saveHaircutService = ({ id, values }: { id?: number; values: HaircutServiceInput }) =>
  id
    ? api.put<HaircutService>(`/cabeleireiro/servicos/${id}`, values)
    : api.post<HaircutService>('/cabeleireiro/servicos', values);
export const deleteHaircutService = (id: number) => api.delete(`/cabeleireiro/servicos/${id}`);

export const saveHaircutEntry = ({ id, values }: { id?: number; values: HaircutEntryInput }) =>
  id
    ? api.put<HaircutEntry>(`/cabeleireiro/cortes/${id}`, values)
    : api.post<HaircutEntry>('/cabeleireiro/cortes', values);
export const deleteHaircutEntry = (id: number) => api.delete(`/cabeleireiro/cortes/${id}`);

export const saveHaircutPayment = ({ id, values }: { id?: number; values: HaircutPaymentInput }) =>
  id
    ? api.put<HaircutPayment>(`/cabeleireiro/pagamentos/${id}`, values)
    : api.post<HaircutPayment>('/cabeleireiro/pagamentos', values);
export const deleteHaircutPayment = (id: number) => api.delete(`/cabeleireiro/pagamentos/${id}`);
