import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';

export default function Header() {
  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 pt-[env(safe-area-inset-top)] backdrop-blur-md'>
      <div className='flex min-w-0 items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1 hidden md:inline-flex' />
        <Separator
          orientation='vertical'
          className='mr-2 hidden h-4 data-vertical:self-center md:block'
        />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <ThemeModeToggle />
        <div className='hidden lg:block'>
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
}
