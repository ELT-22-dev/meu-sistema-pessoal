import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import * as z from 'zod';
import { getSession } from '@/lib/auth';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const notFound = (what = 'Registro') => new HttpError(404, `${what} não encontrado`);

type Ctx = { params: Promise<Record<string, string>> };

/** Erro do driver postgres, às vezes embrulhado pelo Drizzle em `cause`. */
function pgCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}

/**
 * Envolve uma API route: exige sessão (além do proxy) e converte erros em JSON.
 */
export function handler(fn: (req: NextRequest, ctx: Ctx) => Promise<unknown>) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      if (!(await getSession())) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
      const result = await fn(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: err.issues[0]?.message ?? 'Dados inválidos', issues: err.issues },
          { status: 400 }
        );
      }
      // Violação de FK (23503) ou de ON DELETE RESTRICT (23001) —
      // ex.: excluir modelo de costura com produção lançada.
      const code = pgCode(err);
      if (code === '23503' || code === '23001') {
        return NextResponse.json(
          { error: 'Este registro está em uso por outros dados e não pode ser removido' },
          { status: 409 }
        );
      }
      console.error(err);
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
  };
}

export async function parseBody<T extends z.ZodType>(req: NextRequest, schema: T) {
  const body = await req.json().catch(() => {
    throw new HttpError(400, 'JSON inválido');
  });
  return schema.parse(body) as z.output<T>;
}

export async function parseId(ctx: Ctx, key = 'id') {
  const params = await ctx.params;
  const id = Number(params[key]);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'ID inválido');
  return id;
}

export const created = (data: unknown) => NextResponse.json(data, { status: 201 });

/** Lê um parâmetro de busca opcional. */
export const param = (req: NextRequest, key: string) =>
  req.nextUrl.searchParams.get(key)?.trim() || undefined;
