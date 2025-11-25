import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/receipt/RouteComponent/1')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/receipt/RouteComponent/1"!</div>
}
