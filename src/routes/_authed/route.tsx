import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppUser } from '@/server/db';
import { getUserRpc } from '@/server/account/account-rpc';

type AuthedContext = {
    user: AppUser;
}

export const Route = createFileRoute('/_authed')({
    beforeLoad: async ({ location }) => {
        const user = await getUserRpc();
        if (!user) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }

        return { user } as AuthedContext;
    },
    component: () => <Outlet />,
})
