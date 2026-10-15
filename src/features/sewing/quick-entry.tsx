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
import {
  saveSewingEntry,
  suggestedPrice,
  type LastPrice,
  type SewingModelRow,
  type SewingWorkerRow
} from './api';
import { SEWING_ROLES } from './schema';

const LAST_MODEL_KEY = 'costura:ultimo-modelo';
const LAST_WORKER_KEY = 'costura:ultima-pessoa';
const QUICK_ADD = [1, 5, 10, 50];

function readNumber(key: string) {
  try {
    return Number(localStorage.getItem(key)) || null;
  } catch {
    return null;
  }
}

function Chip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
        active
          ? 'border-primary bg-primary/15 text-foreground'
          : 'hover:bg-muted text-muted-foreground'
      )}
    >
      {children}
    </button>
  );
}

/** Lançamento rápido de produção — pensado para o celular, com botões grandes. */
export function QuickEntry({
  models,
  workers,
  prices
}: {
  models: SewingModelRow[];
  workers: SewingWorkerRow[];
  prices: LastPrice[] | undefined;
}) {
  const activeModels = models.filter((m) => m.active);
  const activeWorkers = workers.filter((w) => w.active);
  // Lembra o último modelo e a última pessoa neste aparelho (só monta no cliente).
  const [pickedModel, setPickedModel] = useState<number | null>(() => readNumber(LAST_MODEL_KEY));
  const [pickedWorker, setPickedWorker] = useState<number | null>(() =>
    readNumber(LAST_WORKER_KEY)
  );
  const [quantity, setQuantity] = useState(0);
  const [date, setDate] = useState(todayISO());
  // Preço digitado vale só para a combinação pessoa+modelo em que foi digitado.
  const [priceEdit, setPriceEdit] = useState<{ key: string; value: string } | null>(null);

  const model = activeModels.find((m) => m.id === pickedModel) ?? activeModels[0];
  const workerId = activeWorkers.some((w) => w.id === pickedWorker) ? pickedWorker : null;
  const comboKey = `${workerId ?? 'eu'}-${model?.id}`;
  const suggestion = suggestedPrice(prices, workerId, model);
  const priceText =
    priceEdit?.key === comboKey
      ? priceEdit.value
      : suggestion !== undefined
        ? String(suggestion)
        : '';
  const unitPrice = Number(priceText.replace(',', '.'));
  const priceValid = Number.isFinite(unitPrice) && unitPrice > 0;

  const who = workerId ? activeWorkers.find((w) => w.id === workerId)?.name : 'Eu';
  const mutation = useApiMutation(saveSewingEntry, {
    success: `${quantity} peça(s) de ${model?.name ?? ''} — ${who}`,
    onSuccess: () => setQuantity(0)
  });

  if (activeModels.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-start gap-3'>
          <p className='text-sm'>
            Cadastre os <strong>modelos de peça</strong> (calça, short, camisa...) e o preço por
            peça para começar a lançar a produção.
          </p>
          <Button render={<Link href='/dashboard/costura/modelos' />}>
            <Icons.add /> Cadastrar modelos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const submit = () => {
    if (!model || quantity <= 0 || !priceValid) return;
    try {
      localStorage.setItem(LAST_MODEL_KEY, String(model.id));
      localStorage.setItem(LAST_WORKER_KEY, String(workerId ?? ''));
    } catch {}
    mutation.mutate({
      values: { date, workerId: workerId ?? '', modelId: model.id, quantity, unitPrice, notes: '' }
    });
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
          <div className='flex items-center justify-between'>
            <Label>Quem costurou</Label>
            <Link
              href='/dashboard/costura/equipe'
              className='text-muted-foreground text-xs underline-offset-4 hover:underline'
            >
              {activeWorkers.length ? 'Editar equipe' : '+ Adicionar retista'}
            </Link>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Chip active={workerId === null} onClick={() => setPickedWorker(null)}>
              <div className='font-medium'>Eu</div>
              <div className='text-xs'>overlock / interlock</div>
            </Chip>
            {activeWorkers.map((w) => (
              <Chip key={w.id} active={w.id === workerId} onClick={() => setPickedWorker(w.id)}>
                <div className='font-medium'>{w.name}</div>
                <div className='text-xs'>
                  {SEWING_ROLES.find((r) => r.value === w.role)?.label ?? w.role}
                </div>
              </Chip>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <Label>Modelo da peça</Label>
          <div className='flex flex-wrap gap-2'>
            {activeModels.map((m) => (
              <Chip key={m.id} active={m.id === model?.id} onClick={() => setPickedModel(m.id)}>
                <div className='font-medium'>{m.name}</div>
                <div className='text-xs tabular-nums'>{formatMoney(m.pricePerPiece)}/peça</div>
              </Chip>
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

        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-2'>
            <Label htmlFor='entry-price'>Preço por peça (R$)</Label>
            <Input
              id='entry-price'
              type='number'
              inputMode='decimal'
              min={0}
              step={0.01}
              value={priceText}
              aria-invalid={!priceValid}
              onChange={(e) => setPriceEdit({ key: comboKey, value: e.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='entry-date'>Dia</Label>
            <Input
              id='entry-date'
              type='date'
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value || todayISO())}
            />
          </div>
        </div>

        <LoadingButton
          size='lg'
          className='h-12 w-full text-base'
          disabled={!model || quantity <= 0 || !priceValid}
          loading={mutation.isPending}
          onClick={submit}
        >
          Salvar{quantity > 0 && priceValid && ` · ${formatMoney(quantity * unitPrice)}`}
        </LoadingButton>
      </CardContent>
    </Card>
  );
}
