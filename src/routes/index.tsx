import { createFileRoute } from '@tanstack/react-router';
import { LandingPage } from '@/features/landing/routes';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ property: 'og:url', content: 'https://parcener.app' }],
  }),
  component: LandingPage,
});
