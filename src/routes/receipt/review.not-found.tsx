import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/receipt/review/not-found')({
    component: RouteComponent,
})

function RouteComponent() {
    return (<div>
        Doesnt exist loser
    </div>)
}
