import { NavGroup } from '@/types';

/**
 * Menu lateral e atalhos do Cmd+K (atalho = duas teclas em sequência).
 */
export const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
      {
        title: 'Início',
        url: '/dashboard',
        icon: 'dashboard',
        shortcut: ['i', 'i'],
        items: []
      }
    ]
  },
  {
    label: 'Sites e sistemas',
    items: [
      {
        title: 'Projetos',
        url: '/dashboard/projetos',
        icon: 'projects',
        shortcut: ['p', 'p'],
        items: []
      },
      {
        title: 'Clientes',
        url: '/dashboard/clientes',
        icon: 'teams',
        shortcut: ['c', 'c'],
        items: []
      },
      {
        title: 'Orçamentos',
        url: '/dashboard/orcamentos',
        icon: 'quote',
        shortcut: ['o', 'o'],
        items: []
      }
    ]
  },
  {
    label: 'Costura',
    items: [
      {
        title: 'Produção',
        url: '/dashboard/costura',
        icon: 'sewing',
        shortcut: ['s', 's'],
        items: []
      },
      {
        title: 'Modelos e preços',
        url: '/dashboard/costura/modelos',
        icon: 'tag',
        shortcut: ['m', 'm'],
        items: []
      }
    ]
  },
  {
    label: 'Dinheiro',
    items: [
      {
        title: 'Financeiro',
        url: '/dashboard/financeiro',
        icon: 'wallet',
        shortcut: ['f', 'f'],
        items: []
      }
    ]
  }
];
