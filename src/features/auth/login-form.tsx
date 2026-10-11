'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Não foi possível entrar');
        setLoading(false);
        return;
      }
      const next = searchParams.get('next');
      router.replace(next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
      router.refresh();
    } catch {
      setError('Sem conexão. Tente de novo.');
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className='space-y-6'>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor='email'>E-mail</FieldLabel>
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='username'
                inputMode='email'
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='password'>Senha</FieldLabel>
              <Input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                required
              />
            </Field>
          </FieldGroup>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <LoadingButton type='submit' loading={loading} className='w-full' size='lg'>
            Entrar
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  );
}
