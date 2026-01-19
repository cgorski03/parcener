import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/shared/lib/auth-client';
import { LoginPage, LoginPendingView } from '@/features/auth/routes/login';

type LoginSearch = {
  redirectTo?: string;
};

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirectTo:
        typeof search.redirectTo === 'string' ? search.redirectTo : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: 'Login | Parcener' },
      {
        name: 'description',
        content: 'Sign in to Parcener to start splitting bills with friends.',
      },
      { property: 'og:title', content: `Login | Parcener` },
      {
        property: 'og:description',
        content: 'Sign in to your Parcener account',
      },
      { property: 'og:url', content: 'https://parcener.app/login' },
    ],
    links: [{ rel: 'canonical', href: 'https://parcener.app/login' }],
  }),
  pendingComponent: LoginPendingView,
  beforeLoad: async ({ search }) => {
    const { data: session } = await authClient.getSession();
    if (session?.user) {
      throw redirect({
        to: search.redirectTo || '/account',
        replace: true,
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { redirectTo } = Route.useSearch();
  return <LoginPage redirectUrl={redirectTo} />;
}
