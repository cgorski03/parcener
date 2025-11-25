import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/receipt/RouteComponent')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/receipt/RouteComponent"!</div>
}
