import { daysUntil, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Prazo com destaque: atrasado em vermelho, próximos dias em âmbar. */
export function DueLabel({ date, done }: { date: string; done?: boolean }) {
  const days = daysUntil(date);
  const label =
    done || days > 7
      ? formatDate(date)
      : days < 0
        ? `Atrasado ${-days}d`
        : days === 0
          ? 'Hoje'
          : days === 1
            ? 'Amanhã'
            : `Em ${days} dias`;

  return (
    <span
      title={formatDate(date)}
      className={cn(
        'text-xs whitespace-nowrap tabular-nums',
        !done && days < 0 && 'text-destructive font-medium',
        !done && days >= 0 && days <= 3 && 'font-medium text-amber-600 dark:text-amber-400',
        (done || days > 3) && 'text-muted-foreground'
      )}
    >
      {label}
    </span>
  );
}
