import { createMiddleware } from '@tanstack/react-start'
import { getServerSession } from './get-server-session';
import { redirect } from '@tanstack/react-router';

export const protectedFunctionMiddleware = createMiddleware().server(
    async ({ next, context, request }) => {
        // Authenticate and Authorie req
        const session = await getServerSession(request, context.auth)
        if (session?.user.id == null) {
            throw redirect({ to: '/' })
        }
        return next({
            context: {
                user: session.user
            }
        })
    },
)
