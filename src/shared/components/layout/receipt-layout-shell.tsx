import { cn } from '@/shared/lib/utils';

interface ReceiptLayoutShellProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  fullBleed?: boolean;
  mainClassName?: string;
}

export function ReceiptLayoutShell({
  header,
  children,
  footer,
  fullBleed = false,
  mainClassName,
}: ReceiptLayoutShellProps) {
  const mainClasses = fullBleed
    ? cn('flex-1 overflow-hidden flex flex-col min-h-0 h-full', mainClassName)
    : cn(
        'flex-1 container max-w-2xl mx-auto px-4 py-6 pb-32 md:pb-12',
        mainClassName,
      );

  const shellClasses = fullBleed
    ? 'h-[100dvh] overflow-hidden bg-gradient-to-b from-background to-muted/20 flex flex-col'
    : 'min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col';

  return (
    <div className={shellClasses}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 w-full">{header}</div>

      {/* Main Scrollable Content */}
      <main className={mainClasses}>
        {fullBleed ? (
          children
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        )}
      </main>

      {/* Sticky Mobile Footer (Optional - typically for Action Buttons) */}
      {footer && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t md:hidden z-50 pb-8">
          <div className="max-w-2xl mx-auto">{footer}</div>
        </div>
      )}
    </div>
  );
}
