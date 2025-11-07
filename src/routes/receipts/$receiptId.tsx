import { createFileRoute } from '@tanstack/react-router'
import { useGetReceipt } from '@/lib/hooks/useGetReceipt'

export const Route = createFileRoute('/receipts/$receiptId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { receiptId } = Route.useParams()
    const { data: receiptData } = useGetReceipt(receiptId)
    return <div>Receipt: {String(JSON.stringify(receiptData)) ?? "Loading"}</div>
}
