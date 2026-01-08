import { AppHeader } from '@/shared/components/layout/app-header';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  PaymentMethodsSection,
  PaymentMethodsSkeleton,
} from '@/features/payment-methods/components/payment-method-section';
import { Suspense } from 'react';
import {
  MembershipStatusContainer,
  MembershipStatusSkeleton,
} from '../components/membership-status-container';
import { SignOutButton } from '@/shared/components/common/sign-out-button';
import { Route } from '@/routes/_authed/account';
import { RecentUploads } from '@/features/dashboard/components/recent-uploads-widget';
import { RecentRooms } from '@/features/dashboard/components/recent-rooms-widget';

export function AccountRouteComponent() {
  const { user } = Route.useRouteContext();

  return (
    <div className="min-h-screen bg-muted/20 pb-20 font-sans">
      <AppHeader title="Account" right={<SignOutButton />} />

      <div className="container max-w-md mx-auto p-4 space-y-5">
        {/* 1. Profile Section: Renders instantly from Route Context */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background rounded-xl border shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate">{user?.name}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* 2. Membership: This suspends and shows our custom skeleton */}
        <Suspense fallback={<MembershipStatusSkeleton />}>
          <MembershipStatusContainer />
        </Suspense>

        {/* 3. Payments: If this also fetches data, wrap it too */}
        <Suspense fallback={<PaymentMethodsSkeleton />}>
          <PaymentMethodsSection />
        </Suspense>

        {/* 4. Conditional Content */}
        {user.canUpload && <RecentUploads />}
        <RecentRooms />
      </div>
    </div>
  );
}
