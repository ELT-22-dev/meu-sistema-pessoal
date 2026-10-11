'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { DataList, StopPropagation } from '@/components/app/data-list';
import { FilterBar, SearchBox, useSearchParam } from '@/components/app/filters';
import { formatMoney } from '@/lib/format';
import { clientsQuery, whatsappLink, type ClientRow } from './api';
import { ClientFormSheet } from './client-form';

function WhatsAppButton({ phone }: { phone: string | null }) {
  const link = whatsappLink(phone);
  if (!link) return null;
  return (
    <StopPropagation>
      <Button
        variant='ghost'
        size='icon'
        render={<a href={link} target='_blank' rel='noopener noreferrer' />}
        aria-label='Abrir WhatsApp'
      >
        <Icons.whatsapp className='text-primary' />
      </Button>
    </StopPropagation>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { search, value, setValue } = useSearchParam();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery(clientsQuery(search));

  const openClient = (c: ClientRow) => router.push(`/dashboard/clientes/${c.id}`);

  return (
    <PageContainer
      pageTitle='Clientes'
      pageDescription='Quem contrata seus sites, sistemas e automações.'
      pageHeaderAction={
        <Button onClick={() => setOpen(true)}>
          <Icons.add /> <span className='hidden sm:inline'>Novo cliente</span>
          <span className='sm:hidden'>Novo</span>
        </Button>
      }
    >
      <FilterBar>
        <SearchBox value={value} onChange={setValue} placeholder='Buscar nome, empresa, contato' />
      </FilterBar>

      <DataList
        rows={data}
        isLoading={isLoading}
        getKey={(c) => c.id}
        onRowClick={openClient}
        empty={{
          icon: <Icons.teams />,
          title: search ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda',
          description: search ? 'Tente outra busca.' : 'Cadastre seu primeiro cliente.',
          action: !search && (
            <Button onClick={() => setOpen(true)}>
              <Icons.add /> Novo cliente
            </Button>
          )
        }}
        columns={[
          {
            header: 'Cliente',
            cell: (c) => (
              <div>
                <div className='font-medium'>{c.name}</div>
                {c.company && <div className='text-muted-foreground text-xs'>{c.company}</div>}
              </div>
            )
          },
          {
            header: 'Contato',
            cell: (c) => (
              <div className='text-muted-foreground text-sm'>
                <div>{c.phone}</div>
                <div>{c.email}</div>
              </div>
            )
          },
          { header: 'Projetos', className: 'text-center', cell: (c) => c.projectCount },
          {
            header: 'Recebido',
            className: 'text-right tabular-nums',
            cell: (c) => formatMoney(c.received)
          },
          { header: '', className: 'w-12', cell: (c) => <WhatsAppButton phone={c.phone} /> }
        ]}
        card={(c) => (
          <div className='flex items-center gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='truncate font-medium'>{c.name}</div>
              <div className='text-muted-foreground truncate text-xs'>
                {[c.company, c.phone].filter(Boolean).join(' · ') || 'Sem contato'}
              </div>
              <div className='text-muted-foreground mt-1 text-xs'>
                {c.projectCount} projeto(s) · {formatMoney(c.received)} recebido
              </div>
            </div>
            <WhatsAppButton phone={c.phone} />
          </div>
        )}
      />

      <ClientFormSheet
        open={open}
        onOpenChange={setOpen}
        onSaved={(c) => router.push(`/dashboard/clientes/${c.id}`)}
      />
    </PageContainer>
  );
}
