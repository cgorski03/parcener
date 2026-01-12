import { createFileRoute } from '@tanstack/react-router';
import { AccountRouteComponent } from '@/features/account/routes';

export const Route = createFileRoute('/_authed/account')({
  component: RouteComponent,
});

function RouteComponent() {
  return <AccountRouteComponent />;
}
