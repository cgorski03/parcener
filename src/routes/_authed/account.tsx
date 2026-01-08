import { AccountRouteComponent } from '@/features/account/routes';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/account')({
  component: RouteComponent,
});

function RouteComponent() {
  return <AccountRouteComponent />;
}
