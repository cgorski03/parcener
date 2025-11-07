import { getReceipt } from '@/server/get-receipt/rpc-get-receipt'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useGetReceipt } from '@/lib/hooks/useGetReceipt'

export const Route = createFileRoute('/receipts/$receiptId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { receiptId } = Route.useParams()
    const { data: receiptData } = useGetReceipt(receiptId)
    return <div>Receipt: {String(JSON.stringify(receiptData)) ?? "Loading"}</div>
}
