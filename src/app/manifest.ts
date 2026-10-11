import type { MetadataRoute } from 'next';

// Permite "Adicionar à tela inicial" no celular/tablet e abrir como app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LaFlow — Meu sistema',
    short_name: 'LaFlow',
    description: 'Clientes, projetos, orçamentos, financeiro e costura.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    lang: 'pt-BR',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
  };
}
