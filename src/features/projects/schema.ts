import * as z from 'zod';
import { PROJECT_STATUS_VALUES, PROJECT_TYPE_VALUES } from '@/config/options';
import { money, optDate, optId, optText, reqText } from '@/lib/zod-helpers';

export const projectSchema = z.object({
  title: reqText('Título'),
  clientId: optId,
  type: z.enum(PROJECT_TYPE_VALUES),
  status: z.enum(PROJECT_STATUS_VALUES),
  value: money('Valor'),
  startDate: optDate,
  dueDate: optDate,
  url: optText(500),
  description: optText(5000)
});

export type ProjectInput = z.input<typeof projectSchema>;

export const taskSchema = z.object({
  title: reqText('Tarefa'),
  dueDate: optDate
});

export const taskUpdateSchema = z.object({
  title: reqText('Tarefa').optional(),
  done: z.boolean().optional(),
  dueDate: optDate.optional()
});

/** Pagamento recebido de um projeto — vira receita no financeiro. */
export const projectPaymentSchema = z.object({
  amount: z.number({ error: 'Informe o valor' }).positive('Valor deve ser maior que zero'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data'),
  description: optText(200)
});
