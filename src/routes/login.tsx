import { createFileRoute, redirect } from '@tanstack/react-router'
import { authClient } from '@/shared/lib/auth-client'
import { LoginPage, LoginPendingView } from '@/features/auth/routes/login'

type LoginSearch = {
    redirect?: string
}

export const Route = createFileRoute('/login')({
    validateSearch: (search: Record<string, unknown>): LoginSearch => {
        return {
            redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
        }
    },
    head: () => ({
        meta: [
            { title: 'Login | Parcener' },
            { property: 'og:title', content: `Login | Parcener` },
        ],
    }),
    pendingComponent: LoginPendingView,
    beforeLoad: async ({ search }) => {
        const { data: session } = await authClient.getSession()
        if (session?.user) {
            throw redirect({
                to: search.redirect || '/account',
                replace: true
            })
        }
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { redirect } = Route.useSearch()
    return <LoginPage redirectUrl={redirect} />
}
