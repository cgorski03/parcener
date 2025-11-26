import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/receipt/review')({
  component: () => <Outlet />,
})
