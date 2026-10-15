'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { DataList, StopPropagation } from '@/components/app/data-list';
import { ToneBadge } from '@/components/app/status-badge';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { deleteSewingModel, sewingModelsQuery, type SewingModelRow } from './api';
import { SewingModelSheet } from './sewing-forms';

export default function SewingModelsPage() {
  const { data, isLoading } = useQuery(sewingModelsQuery());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SewingModelRow | null>(null);
  const [deleting, setDeleting] = useState<SewingModelRow | null>(null);
  const remove = useApiMutation(deleteSewingModel, {
    success: 'Modelo excluído',
    onSuccess: () => setDeleting(null)
  });

  const openForm = (m: SewingModelRow | null) => {
    setEditing(m);
    setOpen(true);
  };

  const deleteButton = (m: SewingModelRow) => (
    <StopPropagation>
      <Button variant='ghost' size='icon-sm' onClick={() => setDeleting(m)} aria-label='Excluir'>
        <Icons.trash />
      </Button>
    </StopPropagation>
  );

  return (
    <PageContainer
      pageTitle='Modelos de peça'
      pageDescription='Calça, short, camisa... com o preço padrão por peça (dá para ajustar em cada lançamento).'
      pageHeaderAction={
        <Button onClick={() => openForm(null)}>
          <Icons.add /> <span className='hidden sm:inline'>Novo modelo</span>
          <span className='sm:hidden'>Novo</span>
        </Button>
      }
    >
      <DataList
        rows={data}
        isLoading={isLoading}
        getKey={(m) => m.id}
        onRowClick={openForm}
        empty={{
          icon: <Icons.tag />,
          title: 'Nenhum modelo cadastrado',
          description: 'Ex.: Calça a R$ 1,00 por peça.',
          action: (
            <Button onClick={() => openForm(null)}>
              <Icons.add /> Novo modelo
            </Button>
          )
        }}
        columns={[
          {
            header: 'Modelo',
            cell: (m) => (
              <div className='flex items-center gap-2'>
                <span className='font-medium'>{m.name}</span>
                {!m.active && <ToneBadge tone='gray'>Inativo</ToneBadge>}
              </div>
            )
          },
          {
            header: 'Preço/peça',
            className: 'tabular-nums',
            cell: (m) => formatMoney(m.pricePerPiece)
          },
          {
            header: 'Peças feitas',
            className: 'tabular-nums',
            cell: (m) => formatNumber(m.totalPieces)
          },
          { header: 'Último uso', cell: (m) => (m.lastUsed ? formatDate(m.lastUsed) : '—') },
          { header: '', className: 'w-10', cell: deleteButton }
        ]}
        card={(m) => (
          <div className='flex items-center gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <span className='truncate font-medium'>{m.name}</span>
                {!m.active && <ToneBadge tone='gray'>Inativo</ToneBadge>}
              </div>
              <div className='text-muted-foreground text-xs'>
                {formatNumber(m.totalPieces)} peças feitas
              </div>
            </div>
            <span className='text-primary font-semibold tabular-nums'>
              {formatMoney(m.pricePerPiece)}
            </span>
            {deleteButton(m)}
          </div>
        )}
      />

      <SewingModelSheet
        key={editing?.id ?? 'novo'}
        model={editing}
        open={open}
        onOpenChange={setOpen}
      />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title='Excluir modelo?'
        description='Se já tiver produção lançada com ele, desative em vez de excluir.'
      />
    </PageContainer>
  );
}
