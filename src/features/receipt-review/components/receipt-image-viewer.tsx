import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Minus, Plus } from 'lucide-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { ReceiptItemDto } from '@/shared/dto/types';
import { Button } from '@/shared/components/ui/button';

interface ReceiptImageViewerProps {
  receiptId: string;
  items: Array<ReceiptItemDto>;
}

export function ReceiptImageViewer({
  receiptId,
  items,
}: ReceiptImageViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const minDrawerHeightRef = useRef(120);
  const maxDrawerHeightRef = useRef(0);
  const dragStateRef = useRef({
    startY: 0,
    startHeight: 0,
    dragging: false,
  });

  const itemCountLabel = useMemo(() => {
    return `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
  }, [items.length]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const updateHeights = () => {
      const containerHeight = containerRef.current?.clientHeight ?? 0;
      const minDrawerHeight = 120;
      const minImageHeight = 200;
      const maxDrawerHeight = Math.max(
        minDrawerHeight,
        containerHeight - minImageHeight,
      );

      minDrawerHeightRef.current = minDrawerHeight;
      maxDrawerHeightRef.current = maxDrawerHeight;

      setDrawerHeight((current) => (current ? current : maxDrawerHeight));
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, []);

  const handleDrawerPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startY: event.clientY,
      startHeight: drawerHeight,
      dragging: true,
    };
  };

  const handleDrawerPointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!dragStateRef.current.dragging) return;
    const delta = event.clientY - dragStateRef.current.startY;
    const nextHeight = dragStateRef.current.startHeight - delta;
    const clampedHeight = Math.min(
      maxDrawerHeightRef.current,
      Math.max(minDrawerHeightRef.current, nextHeight),
    );
    setDrawerHeight(clampedHeight);
  };

  const handleDrawerPointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!dragStateRef.current.dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current.dragging = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-0 w-full overflow-hidden bg-black"
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={4}
        centerOnInit
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 shadow-sm backdrop-blur">
              <Image className="size-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Receipt View
              </span>
            </div>

            <div className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-full border bg-background/90 px-2 py-1 shadow-sm backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => zoomOut()}
                aria-label="Zoom out"
              >
                <Minus className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-semibold"
                onClick={() => resetTransform()}
                aria-label="Reset zoom"
              >
                Fit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => zoomIn()}
                aria-label="Zoom in"
              >
                <Plus className="size-4" />
              </Button>
            </div>

            <TransformComponent
              wrapperClass="h-full w-full"
              contentClass="h-full w-full"
              wrapperStyle={{ touchAction: 'none' }}
            >
              <div className="flex h-full w-full items-center justify-center bg-black">
                {hasError ? (
                  <div className="text-sm text-muted-foreground">
                    Receipt image unavailable.
                  </div>
                ) : (
                  <img
                    src={`/api/receipt-image/receipt/${receiptId}`}
                    alt="Receipt image"
                    loading="lazy"
                    onError={() => setHasError(true)}
                    className="max-h-full max-w-full select-none pointer-events-none"
                  />
                )}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      <div
        className="absolute bottom-0 left-0 right-0 z-30 flex flex-col border-t bg-background/95 backdrop-blur shadow-lg"
        style={{ height: drawerHeight }}
      >
        <button
          type="button"
          className="w-full px-4 pt-3 pb-2 text-left touch-none"
          onPointerDown={handleDrawerPointerDown}
          onPointerMove={handleDrawerPointerMove}
          onPointerUp={handleDrawerPointerUp}
        >
          <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Items</span>
            <span className="text-xs text-muted-foreground">
              {itemCountLabel}
            </span>
          </div>
        </button>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.receiptItemId}
                className="rounded-lg border bg-card px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-snug">
                      {item.quantity > 1 && (
                        <span className="mr-1 text-xs text-muted-foreground">
                          {item.quantity}x
                        </span>
                      )}
                      {item.interpretedText}
                    </div>
                    {item.rawText && (
                      <div className="mt-1 text-[10px] font-mono text-muted-foreground truncate">
                        OCR: {item.rawText}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-sm font-semibold tabular-nums">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
