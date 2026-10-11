'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { navGroups } from '@/config/nav-config';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { logout } from '@/features/auth/logout';

export function isNavActive(pathname: string, url: string) {
  if (url === '/dashboard') return pathname === '/dashboard';
  // "/dashboard/costura" não deve acender em "/dashboard/costura/modelos".
  const others = navGroups.flatMap((g) => g.items.map((i) => i.url));
  const longer = others.find(
    (o) => o !== url && o.startsWith(url) && (pathname === o || pathname.startsWith(`${o}/`))
  );
  return !longer && (pathname === url || pathname.startsWith(`${url}/`));
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function AppSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const filteredGroups = useFilteredNavGroups(navGroups);
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' render={<Link href='/dashboard' />}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src='/icon.svg' alt='' className='size-8 shrink-0 rounded-lg' />
              <div className='grid flex-1 text-left leading-tight'>
                <span className='truncate font-semibold'>LaFlow</span>
                <span className='text-muted-foreground truncate text-xs'>Meu sistema</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label || 'geral'} className='py-1'>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={
                        <Link
                          href={item.url}
                          aria-label={item.title}
                          onClick={() => isMobile && setOpenMobile(false)}
                        />
                      }
                      tooltip={item.title}
                      isActive={isNavActive(pathname, item.url)}
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size='lg'
                    className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
                  />
                }
              >
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarFallback className='bg-primary/15 text-primary rounded-lg text-xs font-semibold'>
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user.name}</span>
                  <span className='text-muted-foreground truncate text-xs'>{user.email}</span>
                </div>
                <Icons.chevronsUpDown className='ml-auto size-4' />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--anchor-width) min-w-56 rounded-lg'
                side={isMobile ? 'bottom' : 'right'}
                align='end'
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='text-sm font-medium'>{user.name}</div>
                    <div className='text-muted-foreground text-xs'>{user.email}</div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => window.open('https://thelaflow.com', '_blank', 'noopener')}
                  >
                    <Icons.world className='mr-2 h-4 w-4' />
                    Meu site
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <Icons.logout className='mr-2 h-4 w-4' />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
