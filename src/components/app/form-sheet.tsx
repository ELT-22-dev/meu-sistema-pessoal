'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

/**
 * Formulário em painel: sobe de baixo no celular e abre à direita no desktop.
 * O `<form id={formId}>` fica nos children; o botão de salvar usa `form={formId}`.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  formId,
  submitLabel = 'Salvar',
  loading,
  children,
  footerExtra,
  wide
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  formId: string;
  submitLabel?: string;
  loading?: boolean;
  children: React.ReactNode;
  footerExtra?: React.ReactNode;
  wide?: boolean;
}) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'flex flex-col gap-0',
          isMobile ? 'max-h-[92dvh] rounded-t-2xl' : wide ? 'w-full sm:max-w-2xl' : 'sm:max-w-lg'
        )}
      >
        <SheetHeader className='border-b'>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className='flex-1 overflow-y-auto overscroll-contain px-4 py-4'>{children}</div>
        <SheetFooter className='flex-row gap-2 border-t pb-[max(1rem,env(safe-area-inset-bottom))]'>
          {footerExtra}
          <Button
            type='button'
            variant='outline'
            className='flex-1 sm:flex-none'
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <LoadingButton
            loading={loading}
            type='submit'
            form={formId}
            className='flex-1 sm:flex-none'
          >
            {submitLabel}
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
