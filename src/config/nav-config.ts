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
      },
      {
        title: 'Agenda',
        url: '/dashboard/agenda',
        icon: 'calendar',
        shortcut: ['a', 'a'],
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
        title: 'Equipe',
        url: '/dashboard/costura/equipe',
        icon: 'teams',
        shortcut: ['e', 'e'],
        items: []
      },
      {
        title: 'Modelos de peça',
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
      },
      {
        title: 'Mensalidades',
        url: '/dashboard/mensalidades',
        icon: 'due',
        shortcut: ['r', 'r'],
        items: []
      }
    ]
  }
];
