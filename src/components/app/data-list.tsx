'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

export type Column<T> = {
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

/**
 * Lista responsiva: tabela no tablet/desktop e cards no celular.
 */
export function DataList<T>({
  rows,
  columns,
  card,
  getKey,
  onRowClick,
  isLoading,
  empty
}: {
  rows: T[] | undefined;
  columns: Column<T>[];
  card: (row: T) => React.ReactNode;
  getKey: (row: T) => React.Key;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  empty?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
}) {
  if (isLoading || !rows) {
    return (
      <div className='space-y-2'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-14 w-full rounded-lg' />
        ))}
      </div>
    );
  }

  if (rows.length === 0 && empty) {
    return (
      <Empty className='border'>
        <EmptyHeader>
          {empty.icon && <EmptyMedia variant='icon'>{empty.icon}</EmptyMedia>}
          <EmptyTitle>{empty.title}</EmptyTitle>
          {empty.description && <EmptyDescription>{empty.description}</EmptyDescription>}
        </EmptyHeader>
        {empty.action && <EmptyContent>{empty.action}</EmptyContent>}
      </Empty>
    );
  }

  return (
    <>
      {/* Celular */}
      <div className='space-y-2 md:hidden'>
        {rows.map((row) => (
          <Card
            key={getKey(row)}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === 'Enter') onRowClick(row);
                  }
                : undefined
            }
            className={cn(
              'gap-0 px-4 py-3',
              onRowClick && 'active:bg-muted/60 cursor-pointer transition-colors'
            )}
          >
            {card(row)}
          </Card>
        ))}
      </div>

      {/* Tablet/desktop */}
      <div className='hidden overflow-hidden rounded-lg border md:block'>
        <Table>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={getKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col, i) => (
                  <TableCell key={i} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/** Impede que o clique em botões dentro da linha abra o registro. */
export function StopPropagation({ children }: { children: React.ReactNode }) {
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div onClick={(e) => e.stopPropagation()} className='inline-flex'>
      {children}
    </div>
  );
}
