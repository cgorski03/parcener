import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/parce/not-found')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>That thing does not exist</div>
}
