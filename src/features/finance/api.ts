import { queryOptions } from '@tanstack/react-query';
import { api, qs } from '@/lib/api-client';
import type { Transaction } from '@/db/schema';
import type { TransactionInput } from './schema';

export type TransactionRow = Transaction & {
  clientName: string | null;
  projectTitle: string | null;
};

export type FinanceData = {
  month: string;
  items: TransactionRow[];
  summary: {
    income: number;
    expense: number;
    pendingIncome: number;
    pendingExpense: number;
    balance: number;
  };
  overdue: { income: number; expense: number };
};

export type FinanceFilters = {
  month: string;
  type?: string;
  area?: string;
  status?: string;
  search?: string;
};

export const financeQuery = (filters: FinanceFilters) =>
  queryOptions({
    queryKey: ['finance', filters],
    queryFn: () => api.get<FinanceData>(`/financeiro${qs(filters)}`),
    placeholderData: (prev) => prev
  });

export const saveTransaction = ({ id, values }: { id?: number; values: TransactionInput }) =>
  id
    ? api.put<Transaction>(`/financeiro/${id}`, values)
    : api.post<Transaction>('/financeiro', values);

export const setTransactionStatus = ({ id, status }: { id: number; status: 'pago' | 'pendente' }) =>
  api.patch<Transaction>(`/financeiro/${id}`, { status });

export const deleteTransaction = (id: number) => api.delete(`/financeiro/${id}`);
