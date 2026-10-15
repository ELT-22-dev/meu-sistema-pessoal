'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { StatCard } from '@/components/app/stat-card';
import { PaidBadge, ProjectStatusBadge, QuoteStatusBadge } from '@/components/app/status-badge';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate, formatMoney } from '@/lib/format';
import { ProjectFormSheet } from '@/features/projects/project-form';
import { RecurringFormSheet } from '@/features/recurring/recurring-form';
import { clientQuery, deleteClient, whatsappLink } from './api';
import { ClientFormSheet } from './client-form';

export default function ClientDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data: client, isLoading, error } = useQuery(clientQuery(id));
  const [editOpen, setEditOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const remove = useApiMutation(deleteClient, {
    success: 'Cliente excluído',
    onSuccess: () => router.replace('/dashboard/clientes')
  });

  if (error) {
    return (
      <PageContainer pageTitle='Cliente não encontrado'>
        <Button variant='outline' render={<Link href='/dashboard/clientes' />}>
          Voltar para clientes
        </Button>
      </PageContainer>
    );
  }

  if (isLoading || !client) {
    return (
      <PageContainer>
        <Skeleton className='mb-4 h-10 w-64' />
        <Skeleton className='h-40 w-full' />
      </PageContainer>
    );
  }

  const whatsapp = whatsappLink(client.phone);
  const contracted = client.projects
    .filter((p) => p.status !== 'cancelado' && p.status !== 'lead')
    .reduce((s, p) => s + p.value, 0);
  const received = client.projects.reduce((s, p) => s + p.received, 0);

  return (
    <PageContainer
      pageTitle={client.name}
      pageDescription={client.company ?? undefined}
      pageHeaderAction={
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setEditOpen(true)}
            aria-label='Editar'
          >
            <Icons.edit />
          </Button>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setDeleteOpen(true)}
            aria-label='Excluir'
          >
            <Icons.trash />
          </Button>
        </div>
      }
    >
      <div className='space-y-4'>
        <div className='flex flex-wrap gap-2'>
          {whatsapp && (
            <Button
              variant='outline'
              render={<a href={whatsapp} target='_blank' rel='noopener noreferrer' />}
            >
              <Icons.whatsapp /> WhatsApp
            </Button>
          )}
          {client.email && (
            <Button variant='outline' render={<a href={`mailto:${client.email}`} />}>
              <Icons.mail /> E-mail
            </Button>
          )}
          <Button onClick={() => setProjectOpen(true)}>
            <Icons.add /> Projeto
          </Button>
          <Button
            variant='secondary'
            render={<Link href={`/dashboard/orcamentos/novo?clientId=${client.id}`} />}
          >
            <Icons.quote /> Orçamento
          </Button>
          <Button variant='secondary' onClick={() => setRecurringOpen(true)}>
            <Icons.due /> Mensalidade
          </Button>
        </div>

        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <StatCard label='Projetos' value={client.projects.length} />
          <StatCard label='Contratado' value={formatMoney(contracted)} />
          <StatCard label='Recebido' value={formatMoney(received)} tone='positive' />
          <StatCard
            label='Falta receber'
            value={formatMoney(Math.max(0, contracted - received))}
            tone='accent'
          />
        </div>

        {(client.phone || client.email || client.document || client.notes) && (
          <Card>
            <CardContent className='grid gap-3 text-sm sm:grid-cols-3'>
              {client.phone && <Info label='Telefone' value={client.phone} />}
              {client.email && <Info label='E-mail' value={client.email} />}
              {client.document && <Info label='CPF / CNPJ' value={client.document} />}
              {client.notes && (
                <div className='sm:col-span-3'>
                  <Info label='Observações' value={client.notes} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Projetos</CardTitle>
            </CardHeader>
            <CardContent className='space-y-1'>
              {client.projects.length === 0 && (
                <p className='text-muted-foreground text-sm'>Nenhum projeto ainda.</p>
              )}
              {client.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projetos/${p.id}`}
                  className='hover:bg-muted -mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-2'
                >
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-medium'>{p.title}</div>
                    <div className='text-muted-foreground text-xs'>
                      {formatMoney(p.received)} de {formatMoney(p.value)}
                    </div>
                  </div>
                  <ProjectStatusBadge status={p.status} />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orçamentos</CardTitle>
            </CardHeader>
            <CardContent className='space-y-1'>
              {client.quotes.length === 0 && (
                <p className='text-muted-foreground text-sm'>Nenhum orçamento ainda.</p>
              )}
              {client.quotes.map((q) => (
                <Link
                  key={q.id}
                  href={`/dashboard/orcamentos/${q.id}`}
                  className='hover:bg-muted -mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-2'
                >
                  <div className='min-w-0'>
                    <div className='truncate text-sm font-medium'>{q.title}</div>
                    <div className='text-muted-foreground text-xs'>
                      {formatMoney(q.total)} · {formatDate(q.createdAt)}
                    </div>
                  </div>
                  <QuoteStatusBadge status={q.status} />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos</CardTitle>
            <CardAction>
              <span className='text-muted-foreground text-xs'>últimos 50</span>
            </CardAction>
          </CardHeader>
          <CardContent className='space-y-1'>
            {client.transactions.length === 0 && (
              <p className='text-muted-foreground text-sm'>Nenhum pagamento registrado.</p>
            )}
            {client.transactions.map((t) => (
              <div key={t.id} className='flex items-center justify-between gap-2 py-1.5 text-sm'>
                <div className='min-w-0'>
                  <div className='truncate'>{t.description}</div>
                  <div className='text-muted-foreground text-xs'>{formatDate(t.date)}</div>
                </div>
                <div className='flex items-center gap-2'>
                  <PaidBadge status={t.status} />
                  <span className='font-medium tabular-nums'>{formatMoney(t.amount)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ClientFormSheet client={client} open={editOpen} onOpenChange={setEditOpen} />
      <RecurringFormSheet
        defaultClientId={client.id}
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
      />
      <ProjectFormSheet
        open={projectOpen}
        onOpenChange={setProjectOpen}
        defaultClientId={client.id}
        onSaved={(p) => router.push(`/dashboard/projetos/${p.id}`)}
      />
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.mutate(client.id)}
        loading={remove.isPending}
        title='Excluir cliente?'
        description='Projetos, orçamentos e pagamentos continuam salvos, só ficam sem cliente.'
      />
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className='text-muted-foreground text-xs'>{label}</div>
      <div className='break-words whitespace-pre-line'>{value}</div>
    </div>
  );
}
