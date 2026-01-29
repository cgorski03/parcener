import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import appCss from '../styles.css?url';
import type { QueryClient } from '@tanstack/react-query';
import { GeneralNotFound } from '@/shared/components/layout/not-found';
import { RouteErrorComponent } from '@/shared/components/layout/error-boundary';

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
      {
        name: 'description',
        content:
          'The open source, collaborative, receipt splitting tool. Split bills, not friends.',
      },
      // Open Graph / Facebook / Discord
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Parcener' },
      { property: 'og:title', content: 'Parcener - Split Bills, Not Friends' },
      {
        property: 'og:description',
        content: 'The open source, collaborative, receipt splitting tool',
      },
      { property: 'og:image', content: 'https://parcener.app/og-image.png' },
      { property: 'og:url', content: 'https://parcener.app' },
      { property: 'og:locale', content: 'en_US' },
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
      { rel: 'canonical', href: 'https://parcener.app' },
      { rel: 'stylesheet', href: appCss },
      // Favicons and Icons
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '48x48',
        href: '/favicon-48x48.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        href: '/favicon-96x96.png',
      },
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
  errorComponent: RouteErrorComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md"
        >
          Skip to main content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
