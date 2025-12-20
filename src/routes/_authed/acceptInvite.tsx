import { createFileRoute, Link } from '@tanstack/react-router'
import { inviteIdSearchParamsSchema } from '@/server/dtos'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { CheckCircle2, XCircle, ShieldCheck, AlertCircle, ArrowRight, Home } from 'lucide-react'
import { acceptInviteRpc } from '@/server/account/account-rpc'
import { InviteStatus } from '@/server/account/invitation-service'

export const Route = createFileRoute('/_authed/acceptInvite')({
    validateSearch: inviteIdSearchParamsSchema,
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
            // Skip a DB call 
            return {
                data: { status: 'USER_ALREADY_AUTHORIZED' as InviteStatus },
                message: "You are already verified to upload receipts."
            }
        }
        return await acceptInviteRpc({ data: { token: deps.token } })
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { data, message } = Route.useLoaderData()
    const status = (data?.status as InviteStatus) || 'ERROR'

    const config = getStatusConfig(status)
    const Icon = config.icon

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg border-border/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Icon className={`h-8 w-8 ${config.iconColor}`} />
                    </div>
                    <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
                    <CardDescription className="text-base mt-2">
                        {/* 3. Use the server message if present, otherwise fallback to static config */}
                        {message || config.description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                </CardContent>
                <CardFooter className="flex justify-center pb-8">
                    <Button asChild className="w-full sm:w-auto" variant={config.buttonVariant}>
                        <Link to={config.linkTo}>
                            {config.buttonIcon && <config.buttonIcon className="mr-2 h-4 w-4" />}
                            {config.buttonText}
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

type StatusConfig = {
    title: string
    description: string
    icon: React.ElementType
    iconColor: string
    buttonText: string
    buttonIcon?: React.ElementType
    buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary'
    linkTo: string
}

// 4. Update the argument type to use the local InviteStatus type
function getStatusConfig(status: InviteStatus): StatusConfig {
    switch (status) {
        case 'SUCCESS':
            return {
                title: 'Welcome Aboard!',
                description: 'Invitation accepted successfully. You can now upload receipts.',
                icon: CheckCircle2,
                iconColor: 'text-green-600',
                buttonText: 'Start Uploading',
                buttonIcon: ArrowRight,
                buttonVariant: 'default',
                linkTo: '/upload',
            }
        case 'USER_ALREADY_AUTHORIZED':
            return {
                title: 'Already Authorized',
                description: 'You already have permission to upload receipts.',
                icon: ShieldCheck,
                iconColor: 'text-blue-600',
                buttonText: 'Go to Account',
                buttonIcon: Home,
                buttonVariant: 'secondary',
                linkTo: '/account',
            }
        case 'NOT_FOUND':
            return {
                title: 'Invalid Invitation',
                description: 'This invitation link is invalid, expired, or has already been used.',
                icon: XCircle,
                iconColor: 'text-destructive',
                buttonText: 'Return Home',
                buttonIcon: Home,
                buttonVariant: 'destructive',
                linkTo: '/',
            }
        case 'ERROR':
        default:
            return {
                title: 'Something Went Wrong',
                description: 'We encountered an error processing your invitation. Please try again later.',
                icon: AlertCircle,
                iconColor: 'text-orange-500',
                buttonText: 'Return Home',
                buttonIcon: Home,
                buttonVariant: 'outline',
                linkTo: '/',
            }
    }
}
