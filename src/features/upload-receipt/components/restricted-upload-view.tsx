import { Clock, Lock, ShieldAlert, Ticket } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useUploadRateLimit } from '../hooks/use-upload-rate-limit';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';

export function RestrictedUploadView({
  hasNoAccess,
}: {
  hasNoAccess: boolean;
}) {
  const { data: uploadData, isLoading } = useUploadRateLimit();

  // 1. Loading State
  if (isLoading && !hasNoAccess) {
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

  const isLimitReached = !uploadData || uploadData.used >= uploadData.limit;

  return (
    <Card className="w-full max-w-md border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasNoAccess ? (
            <Lock className="h-5 w-5" />
          ) : (
            <ShieldAlert className="h-5 w-5" />
          )}
          Upload Restricted
        </CardTitle>
        <CardDescription>
          {hasNoAccess
            ? 'This feature is currently invite-only.'
            : "You've reached your daily processing limit."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Visual Restricted Area */}
        <div className="relative w-full h-80 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 rounded-full bg-background border shadow-sm flex items-center justify-center mb-4">
            {hasNoAccess ? (
              <Lock className="h-10 w-10 text-muted-foreground" />
            ) : (
              <Clock className="h-10 w-10 text-orange-500" />
            )}
          </div>

          {hasNoAccess ? (
            <div className="space-y-2">
              <h4 className="font-semibold">Invitation Required</h4>
              <p className="text-sm text-muted-foreground">
                To maintain quality and keep costs low, receipt processing is
                restricted to invited members only.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-semibold">Daily Limit Reached</h4>
              <p className="text-sm text-muted-foreground">
                You have used all <strong>{uploadData?.limit}</strong> of your
                daily receipt uploads.
              </p>
            </div>
          )}
        </div>

        {/* Action/Info Area */}
        {isLimitReached && !hasNoAccess && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between text-xs font-medium">
              <span>Daily Usage</span>
              <span>100%</span>
            </div>
            <Progress value={100} className="h-2 bg-muted" />
            <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> Resets at 00:00 UTC
            </p>
          </div>
        )}

        {hasNoAccess ? (
          <div className="space-y-3">
            <p className=" text-center text-muted-foreground">
              Ask a friend already using Parcener for a{' '}
              <Ticket className="inline h-5 w-5 mx-0.5" /> link.
            </p>
          </div>
        ) : (
          <Button className="w-full" variant="secondary" asChild>
            <Link to="/account">View Past Receipts</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
