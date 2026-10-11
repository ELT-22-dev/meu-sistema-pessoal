import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUS, PROJECT_TYPES, QUOTE_STATUS, TX_AREAS, labelOf } from '@/config/options';
import { cn } from '@/lib/utils';

const TONES = {
  green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  blue: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  red: 'bg-red-500/15 text-red-700 dark:text-red-300',
  gray: 'bg-muted text-muted-foreground',
  sky: 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
} as const;

type Tone = keyof typeof TONES;

export function ToneBadge({
  tone,
  children,
  className
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge variant='secondary' className={cn('border-0', TONES[tone], className)}>
      {children}
    </Badge>
  );
}

const PROJECT_TONE: Record<string, Tone> = {
  lead: 'sky',
  andamento: 'blue',
  revisao: 'amber',
  concluido: 'green',
  pausado: 'gray',
  cancelado: 'red'
};

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={PROJECT_TONE[status] ?? 'gray'}>{labelOf(PROJECT_STATUS, status)}</ToneBadge>
  );
}

export function ProjectTypeLabel({ type }: { type: string }) {
  return <span className='text-muted-foreground'>{labelOf(PROJECT_TYPES, type)}</span>;
}

const QUOTE_TONE: Record<string, Tone> = {
  rascunho: 'gray',
  enviado: 'sky',
  aprovado: 'green',
  recusado: 'red'
};

export function QuoteStatusBadge({ status }: { status: string }) {
  return <ToneBadge tone={QUOTE_TONE[status] ?? 'gray'}>{labelOf(QUOTE_STATUS, status)}</ToneBadge>;
}

const AREA_TONE: Record<string, Tone> = { dev: 'blue', costura: 'amber', pessoal: 'gray' };

export function AreaBadge({ area }: { area: string }) {
  return <ToneBadge tone={AREA_TONE[area] ?? 'gray'}>{labelOf(TX_AREAS, area)}</ToneBadge>;
}

export function PaidBadge({ status }: { status: string }) {
  return status === 'pago' ? (
    <ToneBadge tone='green'>Pago</ToneBadge>
  ) : (
    <ToneBadge tone='amber'>Pendente</ToneBadge>
  );
}
