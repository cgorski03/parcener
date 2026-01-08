import { userQueryOptions } from '@/shared/hooks/use-user';
import { AppUser } from '@/shared/server/db';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

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
          redirect: location.href,
        },
      });
    }

    return { user } as AuthedContext;
  },
  component: () => <Outlet />,
});
