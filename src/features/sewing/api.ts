import { queryOptions } from '@tanstack/react-query';
import { api, qs } from '@/lib/api-client';
import { todayISO } from '@/lib/format';
import type { SewingEntry, SewingModel, SewingPayment, SewingWorker } from '@/db/schema';
import type {
  SewingEntryInput,
  SewingModelInput,
  SewingPaymentInput,
  SewingWorkerInput
} from './schema';

export type SewingModelRow = SewingModel & { totalPieces: number; lastUsed: string | null };
export type SewingEntryRow = SewingEntry & {
  modelName: string;
  workerName: string | null;
  total: number;
};
export type SewingWorkerRow = SewingWorker & {
  monthPieces: number;
  monthValue: number;
  todayPieces: number;
  lastDate: string | null;
};
export type LastPrice = { workerId: number | null; modelId: number; unitPrice: number };

type Totals = { pieces: number; value: number; days: number };
export type SewingSummary = {
  today: Totals;
  week: Totals;
  month: Totals;
  produced: number;
  paid: number;
  balance: number;
  lastPayment: { date: string; amount: number } | null;
  series: { date: string; pieces: number; value: number; teamPieces: number }[];
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

export const sewingWorkersQuery = () =>
  queryOptions({
    queryKey: ['sewing', 'workers', todayISO()],
    queryFn: () => api.get<SewingWorkerRow[]>(`/costura/equipe${qs({ today: todayISO() })}`)
  });

export const lastPricesQuery = () =>
  queryOptions({
    queryKey: ['sewing', 'prices'],
    queryFn: () => api.get<LastPrice[]>('/costura/precos')
  });

/** Preço sugerido: o último usado por essa pessoa nesse modelo, senão o preço do modelo. */
export function suggestedPrice(
  prices: LastPrice[] | undefined,
  workerId: number | null,
  model: { id: number; pricePerPiece: number } | undefined
) {
  if (!model) return undefined;
  const last = prices?.find((p) => p.workerId === workerId && p.modelId === model.id);
  return last?.unitPrice ?? model.pricePerPiece;
}

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

export const saveSewingWorker = ({ id, values }: { id?: number; values: SewingWorkerInput }) =>
  id
    ? api.put<SewingWorker>(`/costura/equipe/${id}`, values)
    : api.post<SewingWorker>('/costura/equipe', values);
export const deleteSewingWorker = (id: number) => api.delete(`/costura/equipe/${id}`);

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
