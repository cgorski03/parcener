import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { RestrictedUploadView } from '@/features/upload-receipt/components/restricted-upload-view';
import { UploadComponent } from '@/features/upload-receipt/components/upload-component';
import { useUploadRateLimitSuspense } from '@/features/upload-receipt/hooks/use-upload-rate-limit';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { AppPageShell } from '@/shared/components/layout/app-page-shell';
import { AppHeader } from '@/shared/components/layout/app-header';

export const Route = createFileRoute('/_authed/upload')({
  head: () => ({
    meta: [
      { title: 'Review Receipt | Parcener' },
      { property: 'og:title', content: `Review Receipt | Parcener` },
    ],
  }),
  component: UploadPageComponent,
});

function UploadPageComponent() {
  const { user } = Route.useRouteContext();

  // User has access - check rate limit with suspense
  return (
    <AppPageShell centered header={<AppHeader title="Upload" />}>
      {!user.canUpload ? (
        <RestrictedUploadView hasNoAccess={true} />
      ) : (
        <Suspense fallback={<UploadSkeleton />}>
          <UploadWithRateLimit />
        </Suspense>
      )}
    </AppPageShell>
  );
}

function UploadWithRateLimit() {
  const { data: uploadData } = useUploadRateLimitSuspense();

  if (!uploadData.canUpload) {
    return <RestrictedUploadView hasNoAccess={false} />;
  }

  return <UploadComponent />;
}

function UploadSkeleton() {
  return (
    <Card className="w-full max-w-md animate-pulse">
      <CardHeader className="space-y-2">
        <div className="h-6 w-1/2 bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-80 bg-muted rounded-xl" />
      </CardContent>
    </Card>
  );
}
