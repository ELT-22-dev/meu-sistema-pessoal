import * as z from 'zod';
import { TX_AREA_VALUES, TX_STATUS_VALUES, TX_TYPE_VALUES } from '@/config/options';
import { optId, reqDate, reqText } from '@/lib/zod-helpers';

export const transactionSchema = z.object({
  type: z.enum(TX_TYPE_VALUES),
  area: z.enum(TX_AREA_VALUES),
  category: reqText('Categoria', 100),
  description: reqText('Descrição'),
  amount: z.number({ error: 'Informe o valor' }).positive('Valor deve ser maior que zero'),
  date: reqDate,
  status: z.enum(TX_STATUS_VALUES),
  clientId: optId,
  projectId: optId
});

export type TransactionInput = z.input<typeof transactionSchema>;
