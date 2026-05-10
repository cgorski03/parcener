import { cn } from '@/shared/lib/utils';

const TEETH = Array.from({ length: 70 }, (_, index) => {
  const x = index * 1.5;
  return `${x.toFixed(3)} ${index % 2 === 0 ? 5 : 2}`;
}).join(' L ');

const EDGE_PATH = `M0 12 V5 L ${TEETH} L100 5 V12 Z`;
const STROKE_PATH = `M0 5 L ${TEETH} L100 5`;

function ReceiptTornEdge({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('block h-3 w-full text-border/70', className)}
      preserveAspectRatio="none"
      viewBox="0 0 100 12"
    >
      <path d={EDGE_PATH} className="fill-background" />
      <path
        d={STROKE_PATH}
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="0.35"
      />
      <path
        d="M0 5 V12 M100 5 V12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="0.35"
      />
    </svg>
  );
}

export function ReceiptPaper({
  children,
  className,
  bodyClassName,
}: {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn('relative bg-background', className)}>
      <ReceiptTornEdge />
      <div
        className={cn(
          'relative overflow-hidden border-x border-border/70',
          bodyClassName,
        )}
      >
        {children}
      </div>
      <ReceiptTornEdge className="rotate-180" />
    </div>
  );
}

export function ReceiptPaperSectionBreak({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative border-t-2 border-dashed border-foreground/35',
        className,
      )}
    >
      <div className="pointer-events-none absolute -left-3 -top-3 h-6 w-6 rounded-full border border-border/70 bg-muted" />
      <div className="pointer-events-none absolute -right-3 -top-3 h-6 w-6 rounded-full border border-border/70 bg-muted" />
      {children}
    </div>
  );
}
