import { Image, List, Loader2, Receipt, XCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import { AppHeader } from '@/shared/components/layout/app-header';
import { Button } from '@/shared/components/ui/button';
import { Route } from '@/routes/_authed/receipt.review.$receiptId';

interface ReviewReceiptHeaderProps {
  title: string;
  itemCount: number;
  receiptIsValidPending: boolean;
  receiptIsInvalid: boolean;
}

export function ReviewReceiptHeader({
  title,
  itemCount,
  receiptIsValidPending,
  receiptIsInvalid,
}: ReviewReceiptHeaderProps) {
  const { receiptId } = Route.useParams();
  const { view } = Route.useSearch();
  const status = receiptIsValidPending
    ? 'pending'
    : receiptIsInvalid
      ? 'invalid'
      : 'valid';
  const nextView = view === 'items' ? 'image' : 'items';

  const statusConfig = {
    pending: {
      icon: Loader2,
      iconClass: 'h-4 w-4 text-primary animate-spin',
      containerClass: 'bg-primary/10 border-primary/20',
    },
    invalid: {
      icon: XCircle,
      iconClass: 'h-4 w-4 text-destructive',
      containerClass: 'bg-destructive/10 border-destructive/20',
    },
    valid: {
      icon: Receipt,
      iconClass: 'h-4 w-4 text-primary',
      containerClass: 'bg-primary/10 border-primary/20',
    },
  };

  const { icon: StatusIcon, iconClass, containerClass } = statusConfig[status];
  return (
    <AppHeader
      className={cn(receiptIsInvalid && 'border-b-destructive/30')}
      title={
        <div className="flex items-center gap-3.5">
          {' '}
          {/* Increased gap */}
          {/* Status Icon Box */}
          <div
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-colors',
              containerClass,
            )}
          >
            <StatusIcon className={iconClass} />
          </div>
          {/* Text Info */}
          <div className="flex flex-col justify-center min-w-0 gap-0.5">
            {' '}
            {/* Added gap-0.5 */}
            <span className="font-bold text-base leading-none truncate tracking-tight">
              {title}
            </span>
            <span className="text-xs text-muted-foreground truncate flex items-center">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
              {receiptIsInvalid && (
                <span className="flex items-center text-destructive font-medium ml-2">
                  <span className="w-1 h-1 rounded-full bg-destructive mr-1.5" />
                  Action Required
                </span>
              )}
            </span>
          </div>
        </div>
      }
      right={
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link
            to="/receipt/review/$receiptId"
            params={{ receiptId }}
            search={{ view: nextView }}
          >
            {view === 'items' ? (
              <>
                <Image className="size-4" />
                Image
              </>
            ) : (
              <>
                <List className="size-4" />
                Items
              </>
            )}
          </Link>
        </Button>
      }
    />
  );
}
