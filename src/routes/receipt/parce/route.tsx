import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/receipt/parce')({
  component: () => <Outlet />,
});
