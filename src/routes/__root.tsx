import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import appCss from '../styles.css?url';
import { QueryClient } from '@tanstack/react-query';
import { GeneralNotFound } from '@/shared/components/layout/not-found';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'Parcener' },
      // Open Graph / Facebook / Discord
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Parcener' },
      { property: 'og:title', content: 'Parcener - Split Bills, Not Friends' },
      {
        property: 'og:description',
        content: 'The open source, collaborative, receipt splitting tool',
      },
      { property: 'og:image', content: 'https://parcener.app/og-image.png' },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Parcener - Split Bills, Not Friends' },
      {
        name: 'twitter:description',
        content: 'The open source, collaborative, receipt splitting tool',
      },
      { name: 'twitter:image', content: 'https://parcener.app/og-image.png' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      // Favicons and Icons
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        href: '/favicon-96x96.png',
      },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: GeneralNotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
export const NotFoundComponent = GeneralNotFound;
