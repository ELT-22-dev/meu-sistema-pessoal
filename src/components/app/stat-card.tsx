import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  loading,
  className
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'default' | 'positive' | 'negative' | 'accent';
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn('gap-0 py-4', className)}>
      <CardContent className='px-4'>
        <div className='text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium sm:text-sm'>
          <span className='truncate'>{label}</span>
          {icon && <span className='[&_svg]:size-4'>{icon}</span>}
        </div>
        {loading ? (
          <Skeleton className='mt-2 h-7 w-24' />
        ) : (
          <div
            className={cn(
              'mt-1 truncate text-xl font-semibold tabular-nums sm:text-2xl',
              tone === 'positive' && 'text-primary',
              tone === 'negative' && 'text-destructive',
              tone === 'accent' && 'text-chart-2'
            )}
          >
            {value}
          </div>
        )}
        {hint && !loading && (
          <div className='text-muted-foreground mt-1 truncate text-xs'>{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}
