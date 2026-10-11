'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { isNavActive } from '@/components/layout/app-sidebar';
import { cn } from '@/lib/utils';

const ITEMS = [
  { title: 'Início', url: '/dashboard', icon: Icons.dashboard },
  { title: 'Projetos', url: '/dashboard/projetos', icon: Icons.projects },
  { title: 'Costura', url: '/dashboard/costura', icon: Icons.sewing },
  { title: 'Financeiro', url: '/dashboard/financeiro', icon: Icons.wallet }
];

/** Barra inferior para celular (o menu completo abre em "Mais"). */
export function MobileNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <nav
      aria-label='Navegação rápida'
      className='bg-background/90 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden'
    >
      <ul className='grid grid-cols-5'>
        {ITEMS.map((item) => {
          const active = isNavActive(pathname, item.url);
          return (
            <li key={item.url}>
              <Link
                href={item.url}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className='size-5' />
                {item.title}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type='button'
            onClick={() => setOpenMobile(true)}
            className='text-muted-foreground flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium'
          >
            <Icons.dots className='size-5' />
            Mais
          </button>
        </li>
      </ul>
    </nav>
  );
}
