import type { ReactNode } from 'react';

interface WidgetShellProps {
  /** Widget title displayed in the header */
  title: string;
  /** Optional action element (button, link) on the right side of header */
  action?: ReactNode;
  /** Widget content */
  children: ReactNode;
}

/**
 * Consistent shell for dashboard widgets.
 * Provides a header with title + optional action, and a body area.
 */
export function WidgetShell({ title, action, children }: WidgetShellProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pl-1 h-7">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

interface WidgetBodyProps {
  children: ReactNode;
  /** Use divided style for list items */
  divided?: boolean;
}

/**
 * Standard widget body with consistent styling.
 */
export function WidgetBody({ children, divided = false }: WidgetBodyProps) {
  return (
    <div
      className={`bg-background rounded-xl border shadow-sm ${divided ? 'divide-y' : ''}`}
    >
      {children}
    </div>
  );
}
