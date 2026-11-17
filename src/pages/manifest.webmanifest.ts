import type { APIRoute } from 'astro';
import { url } from '../lib/url';

export const GET: APIRoute = () => {
  const base = url('/');
  const manifest = {
    id: base,
    name: 'System Design Course',
    short_name: 'SysDesign',
    description: 'An interactive system design course for frontend developers, from zero to interview-ready.',
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'any',
    background_color: '#0e1018',
    theme_color: '#6366f1',
    categories: ['education', 'productivity'],
    icons: [
      { src: url('icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: url('icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: url('icons/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Continue learning', short_name: 'Learn', url: base },
      { name: 'Design Canvas', short_name: 'Practice', url: url('practice') },
      { name: 'Flashcards', short_name: 'Cards', url: url('flashcards') },
    ].map((s) => ({ ...s, icons: [{ src: url('icons/icon-192.png'), sizes: '192x192', type: 'image/png' }] })),
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
