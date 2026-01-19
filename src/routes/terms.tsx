import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      { title: 'Terms of Service | Parcener' },
      {
        name: 'description',
        content:
          'Read the Terms of Service for Parcener, the open source collaborative receipt splitting tool.',
      },
      { property: 'og:title', content: 'Terms of Service | Parcener' },
      {
        property: 'og:description',
        content:
          'Read the Terms of Service for Parcener, the open source collaborative receipt splitting tool.',
      },
      { property: 'og:url', content: 'https://parcener.app/terms' },
    ],
    links: [{ rel: 'canonical', href: 'https://parcener.app/terms' }],
  }),
});
