import { Button } from '@/components/ui/button'
import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { useEffect } from 'react'

interface LoginSearch {
    redirect?: string
}

export const Route = createFileRoute('/login')({
    validateSearch: (search: Record<string, unknown>): LoginSearch => ({
        redirect: search.redirect as string | undefined,
    }),
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const search = useSearch({ from: '/login' })
    const redirectUrl = search.redirect

    const { data: session, isPending } = authClient.useSession()

    // Redirect if already logged in
    useEffect(() => {
        if (session?.user) {
            navigate({ to: redirectUrl || '/account' })
        }
    }, [session, navigate, redirectUrl])

    const signIn = () => {
        authClient.signIn.social({
            provider: 'google',
            callbackURL: redirectUrl
        })
    }

    if (isPending) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            <Button onClick={signIn}>Sign in with Google</Button>
            {redirectUrl && (
                <p className="mt-4 text-sm text-muted-foreground">
                    You will be redirected to: {redirectUrl}
                </p>
            )}
        </div>
    )
}
