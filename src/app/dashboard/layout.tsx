import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // O proxy já protege; aqui garantimos a sessão e pegamos o usuário.
  const session = await getSession();
  if (!session) redirect('/login');

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get('sidebar_state')?.value;
  const defaultOpen = sidebarCookie === undefined ? true : sidebarCookie === 'true';

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <a
          href='#main-content'
          className='bg-background ring-ring sr-only rounded-md px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:ring-2'
        >
          Pular para o conteúdo
        </a>
        <AppSidebar user={session} />
        <SidebarInset
          id='main-content'
          tabIndex={-1}
          className='min-w-0 scroll-mt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0'
        >
          <Header />
          <InfobarProvider defaultOpen={false}>
            {children}
            <InfoSidebar side='right' />
          </InfobarProvider>
        </SidebarInset>
        <MobileNav />
      </SidebarProvider>
    </KBar>
  );
}
