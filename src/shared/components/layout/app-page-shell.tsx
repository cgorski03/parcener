import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface AppPageShellProps {
  children: ReactNode;
  /** Header element (typically AppHeader) */
  header?: ReactNode;
  /** Center content vertically (for action/task pages like upload). Implies no scroll. */
  centered?: boolean;
  /** Additional classes for the outer container */
  className?: string;
  /** Additional classes for the content container */
  contentClassName?: string;
}

/**
 * Shell for in-app pages (account, upload, settings).
 * - Fixed viewport height for native feel
 * - Two modes: scrollable (lists) or centered (actions)
 * - Consistent max-width and padding
 */
export function AppPageShell({
  children,
  header,
  centered = false,
  className,
  contentClassName,
}: AppPageShellProps) {
  return (
    <div
      className={cn(
        'h-screen flex flex-col overflow-hidden bg-muted/20',
        className,
      )}
    >
      {header}

      <main
        id="main-content"
        className={cn(
          'flex-1',
          centered
            ? 'flex items-center justify-center overflow-hidden'
            : 'overflow-y-auto',
        )}
      >
        <div
          className={cn(
            'w-full max-w-md mx-auto p-4',
            !centered && 'pb-20',
            contentClassName,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
