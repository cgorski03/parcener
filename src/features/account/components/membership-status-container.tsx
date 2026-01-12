import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { userQueryOptionsWithRedirect } from '@/shared/hooks/use-user';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { InviteSection } from '@/features/invitations/components/invite-section';
import { AccountUploadsSection } from '@/features/upload-receipt/components/upload-account-section';

export function MembershipStatusContainer() {
  const { data: user } = useSuspenseQuery(userQueryOptionsWithRedirect);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
        Membership Status
      </h3>

      <Card className="py-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <AccountUploadsSection user={user} />

          {user.canUpload && (
            <>
              <Separator />
              {/* Part 2: Invite Button */}
              <InviteSection />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function MembershipStatusSkeleton() {
  return (
    <div className="space-y-2">
      {/* Header Label */}
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
        Membership Status
      </h3>

      <Card className="py-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Uploads Section Skeleton */}
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-end">
              <Skeleton className="h-4 w-28" /> {/* "Receipt Uploads" */}
              <Skeleton className="h-3 w-24" /> {/* "Resets at..." */}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-1.5 w-full" /> {/* Progress Bar */}
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" /> {/* used/limit */}
                <Skeleton className="h-3 w-16" /> {/* "Daily Limit" */}
              </div>
            </div>
          </div>

          <Separator />

          {/* Invite Section Skeleton */}
          <div className="bg-muted/20 p-4 space-y-4">
            <div className="flex items-start gap-3">
              {/* Icon Circle */}
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" /> {/* Title */}
                  <Skeleton className="h-4 w-20 rounded-full" /> {/* Pill */}
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
            {/* Button */}
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
