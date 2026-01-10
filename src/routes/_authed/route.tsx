import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import type { AppUser } from '@/shared/server/db';
import { userQueryOptions } from '@/shared/hooks/use-user';

type AuthedContext = {
    user: AppUser;
};

export const Route = createFileRoute('/_authed')({
    beforeLoad: async ({ context, location }) => {
        const user = await context.queryClient.ensureQueryData(userQueryOptions);

        if (!user) {
            throw redirect({
                to: '/login',
                search: {
                    redirectTo: location.href,
                },
            });
        }

        return { user } as AuthedContext;
    },
    component: () => <Outlet />,
});
