import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <main className='relative flex min-h-dvh items-center justify-center px-4 py-10'>
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 -z-10'
        style={{
          background:
            'radial-gradient(circle at 20% -10%, rgb(16 185 129 / 0.15), transparent 40%), radial-gradient(circle at 80% 0%, rgb(99 102 241 / 0.12), transparent 35%)'
        }}
      />
      <div className='w-full max-w-sm'>
        <div className='mb-8 flex flex-col items-center gap-3 text-center'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/icon.svg' alt='' width={56} height={56} className='rounded-2xl' />
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>LaFlow</h1>
            <p className='text-muted-foreground text-sm'>Seu sistema de trabalho</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
