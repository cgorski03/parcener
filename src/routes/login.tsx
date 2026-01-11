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
            { property: 'og:title', content: `Login | Parcener` },
        ],
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
