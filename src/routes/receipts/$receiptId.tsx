import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/receipts/$receiptId')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Hello "/receipts/$receiptId"!</div>
}
