import { createFileRoute } from '@tanstack/react-router'
import { validateInviteSearch } from '@/shared/lib/validation'
import { AcceptInvitePage } from '@/features/invitations/routes/accept-invite'
import { acceptInviteRpc } from '@/features/invitations/server/invitation-rpc'
import type { InviteStatus } from '@/features/invitations/server/invitation-service'

export const Route = createFileRoute('/_authed/acceptInvite')({
    validateSearch: validateInviteSearch,
    head: () => ({
        meta: [
            { title: 'Accept Invitation | Parcener' },
            { property: 'og:title', content: 'Accept Invitation | Parcener' },
            { property: 'og:description', content: 'Accept invitation to begin uploading receipts!' },
        ],
    }),
    loaderDeps: ({ search }) => ({
        token: search.token,
    }),
    loader: async ({ deps, context }) => {
        if (context.user.canUpload) {
            return { status: 'USER_ALREADY_AUTHORIZED' as InviteStatus }
        }
        try {
            return await acceptInviteRpc({ data: { token: deps.token } })
        } catch (error: any) {
            if (error?.code === 'NOT_FOUND' || error?.message?.includes('found')) {
                return { status: 'NOT_FOUND' as InviteStatus }
            }
            return { status: 'ERROR' as InviteStatus }
        }
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { status } = Route.useLoaderData()
    return <AcceptInvitePage status={status} />
}
