import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { RecurringCharge } from '@/db/schema';
import type { RecurringInput } from './schema';

export type RecurringRow = RecurringCharge & {
  clientName: string | null;
  projectTitle: string | null;
  paidCount: number;
  pendingAmount: number;
};

export const recurringQuery = () =>
  queryOptions({
    queryKey: ['recurring'],
    queryFn: () => api.get<RecurringRow[]>('/mensalidades')
  });

export const saveRecurring = ({ id, values }: { id?: number; values: RecurringInput }) =>
  id
    ? api.put<RecurringCharge>(`/mensalidades/${id}`, values)
    : api.post<RecurringCharge>('/mensalidades', values);

export const deleteRecurring = (id: number) => api.delete(`/mensalidades/${id}`);
