'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { Icons } from '@/components/icons';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatMoney, todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';
import { saveSewingEntry, type SewingModelRow } from './api';

const LAST_MODEL_KEY = 'costura:ultimo-modelo';
const QUICK_ADD = [1, 5, 10, 50];

/** Lançamento rápido de produção — pensado para o celular, com botões grandes. */
export function QuickEntry({ models }: { models: SewingModelRow[] }) {
  const active = models.filter((m) => m.active);
  // Lembra o último modelo usado neste aparelho (só monta no cliente, após carregar os modelos).
  const [picked, setPicked] = useState<number | null>(() => {
    try {
      return Number(localStorage.getItem(LAST_MODEL_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [quantity, setQuantity] = useState(0);
  const [date, setDate] = useState(todayISO());

  const model = active.find((m) => m.id === picked) ?? active[0];
  const modelId = model?.id ?? null;
  const mutation = useApiMutation(saveSewingEntry, {
    success: `${quantity} peça(s) lançada(s)`,
    onSuccess: () => setQuantity(0)
  });

  if (active.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-start gap-3'>
          <p className='text-sm'>
            Cadastre os <strong>modelos/operações</strong> e quanto a oficina paga por peça para
            começar a lançar sua produção.
          </p>
          <Button render={<Link href='/dashboard/costura/modelos' />}>
            <Icons.add /> Cadastrar modelos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const submit = () => {
    if (!modelId || quantity <= 0) return;
    try {
      localStorage.setItem(LAST_MODEL_KEY, String(modelId));
    } catch {}
    mutation.mutate({ values: { date, modelId, quantity, notes: '' } });
  };

  return (
    <Card className='border-primary/30'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.sewing className='text-primary size-5' /> Lançar produção
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label>Modelo / operação</Label>
          <div className='flex flex-wrap gap-2'>
            {active.map((m) => (
              <button
                key={m.id}
                type='button'
                onClick={() => setPicked(m.id)}
                aria-pressed={m.id === modelId}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  m.id === modelId
                    ? 'border-primary bg-primary/15 text-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <div className='font-medium'>{m.name}</div>
                <div className='text-xs tabular-nums'>{formatMoney(m.pricePerPiece)}/peça</div>
              </button>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='qty'>Quantidade de peças</Label>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='icon-lg'
              className='size-12 shrink-0'
              onClick={() => setQuantity((q) => Math.max(0, q - 1))}
              aria-label='Menos uma'
            >
              <Icons.minus />
            </Button>
            <Input
              id='qty'
              type='number'
              inputMode='numeric'
              min={0}
              value={quantity || ''}
              placeholder='0'
              onChange={(e) => setQuantity(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
              className='h-12 text-center text-2xl font-semibold tabular-nums'
            />
            <Button
              type='button'
              variant='outline'
              size='icon-lg'
              className='size-12 shrink-0'
              onClick={() => setQuantity((q) => q + 1)}
              aria-label='Mais uma'
            >
              <Icons.add />
            </Button>
          </div>
          <div className='grid grid-cols-4 gap-2'>
            {QUICK_ADD.map((n) => (
              <Button
                key={n}
                type='button'
                variant='secondary'
                className='h-10'
                onClick={() => setQuantity((q) => q + n)}
              >
                +{n}
              </Button>
            ))}
          </div>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <div className='space-y-2 sm:w-44'>
            <Label htmlFor='entry-date'>Dia</Label>
            <Input
              id='entry-date'
              type='date'
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value || todayISO())}
            />
          </div>
          <LoadingButton
            size='lg'
            className='h-12 flex-1 text-base'
            disabled={!model || quantity <= 0}
            loading={mutation.isPending}
            onClick={submit}
          >
            Salvar {quantity > 0 && model && `· ${formatMoney(quantity * model.pricePerPiece)}`}
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  );
}
