import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy Policy | Parcener' },
      {
        name: 'description',
        content:
          'Read the Privacy Policy for Parcener. Learn how we handle your data when you use our receipt splitting tool.',
      },
      { property: 'og:title', content: 'Privacy Policy | Parcener' },
      {
        property: 'og:description',
        content:
          'Read the Privacy Policy for Parcener. Learn how we handle your data when you use our receipt splitting tool.',
      },
      { property: 'og:url', content: 'https://parcener.app/privacy' },
    ],
    links: [{ rel: 'canonical', href: 'https://parcener.app/privacy' }],
  }),
});
