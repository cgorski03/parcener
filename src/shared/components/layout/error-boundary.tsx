import { Link, useRouter } from '@tanstack/react-router';
import { AlertTriangle, Check, Copy, Home, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { BrandedPageShell } from './branded-page-shell';
import type { ErrorComponentProps } from '@tanstack/react-router';

const SUPPORT_EMAIL = 'support@parcener.app';

export function RouteErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    import('@sentry/tanstackstart-react').then((Sentry) => {
      const id = Sentry.captureException(error);
      setEventId(id);
    });
  }, [error]);

  const handleCopy = async () => {
    if (!eventId) return;
    await navigator.clipboard.writeText(eventId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    reset();
    router.invalidate();
  };

  return (
    <BrandedPageShell>
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. We've been notified and are looking
            into it.
          </p>
        </div>

        {/* Event ID for support reference */}
        {eventId && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Error Reference
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-sm font-mono text-foreground bg-background px-2 py-1 rounded border">
                {eventId}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>

        {/* Contact info */}
        <p className="text-xs text-muted-foreground pt-4">
          Need help?{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}${eventId ? `?subject=Error Report: ${eventId}` : ''}`}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Contact support
          </a>
          {eventId && ' with the reference above.'}
        </p>
      </div>
    </BrandedPageShell>
  );
}
