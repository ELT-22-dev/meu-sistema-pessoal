import { useRegisterActions } from 'kbar';
import { useTheme } from 'next-themes';
import { useThemeConfig } from '@/components/themes/active-theme';
import { THEMES } from '@/components/themes/theme.config';

const useThemeSwitching = () => {
  const { theme, setTheme } = useTheme();
  const { activeTheme, setActiveTheme } = useThemeConfig();

  const toggleDarkLight = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex((t) => t.value === activeTheme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setActiveTheme(THEMES[nextIndex].value);
  };

  const themeActions = [
    {
      id: 'cycleTheme',
      name: 'Trocar tema',
      shortcut: ['t', 't'],
      section: 'Tema',
      perform: cycleTheme
    },
    {
      id: 'toggleDarkLight',
      name: 'Alternar claro/escuro',
      shortcut: ['d', 'd'],
      section: 'Tema',
      perform: toggleDarkLight
    },
    {
      id: 'setLightTheme',
      name: 'Tema claro',
      section: 'Tema',
      perform: () => setTheme('light')
    },
    {
      id: 'setDarkTheme',
      name: 'Tema escuro',
      section: 'Tema',
      perform: () => setTheme('dark')
    }
  ];

  useRegisterActions(themeActions, [theme, activeTheme]);
};

export default useThemeSwitching;
