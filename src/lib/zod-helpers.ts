import * as z from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Texto obrigatório. */
export const reqText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} é obrigatório`).max(max);

/** Texto opcional: '' vira null. */
export const optText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

/** Data 'YYYY-MM-DD' obrigatória. */
export const reqDate = z.string().regex(DATE_RE, 'Informe a data');

/** Data opcional: '' vira null. */
export const optDate = z
  .union([z.string().regex(DATE_RE, 'Data inválida'), z.literal('')])
  .nullish()
  .transform((v) => v || null);

/** Valor em R$ (>= 0). */
export const money = (label = 'Valor') =>
  z.number({ error: `${label} é obrigatório` }).min(0, `${label} não pode ser negativo`);

/** ID opcional vindo de um select (string) — '' vira null. */
export const optId = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v === '' || v == null ? null : Number(v)));
