import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Minus, Plus } from 'lucide-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { ReceiptItemDto } from '@/shared/dto/types';
import { Button } from '@/shared/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/components/ui/drawer';

interface ReceiptImageViewerProps {
  receiptId: string;
  items: Array<ReceiptItemDto>;
}

export function ReceiptImageViewer({
  receiptId,
  items,
}: ReceiptImageViewerProps) {
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const imageHeightRatio = 0.55;
  const minImageHeight = 220;
  const imageHeightPx = containerHeight
    ? Math.max(minImageHeight, containerHeight * imageHeightRatio)
    : null;
  const drawerMinSnap = containerHeight
    ? Math.min(Math.max(1 - imageHeightPx! / containerHeight, 0.2), 0.85)
    : 0.45;
  const snapPoints = useMemo(() => {
    const midSnap = Math.min(drawerMinSnap + 0.25, 0.9);
    return midSnap > drawerMinSnap + 0.02
      ? [drawerMinSnap, midSnap, 1]
      : [drawerMinSnap, 1];
  }, [drawerMinSnap]);
  const [activeSnapPoint, setActiveSnapPoint] = useState<
    number | string | null
  >(snapPoints[0]);

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
    setActiveSnapPoint((current) =>
      snapPoints.includes(current ?? -1) ? current : snapPoints[0],
    );
  }, [snapPoints]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerHeight(entry.contentRect.height);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-0 w-full overflow-hidden"
    >
      <div
        className="relative w-full overflow-hidden min-h-0"
        style={{
          height: imageHeightPx ? `${imageHeightPx}px` : '55vh',
        }}
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
                contentClass="w-full"
                wrapperStyle={{
                  touchAction: 'none',
                  width: '100%',
                  height: '100%',
                }}
                contentStyle={{ width: '100%' }}
              >
                {hasError ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Receipt image unavailable.
                  </div>
                ) : (
                  <img
                    src={`/api/receipt-image/receipt/${receiptId}`}
                    alt="Receipt image"
                    loading="lazy"
                    onError={() => setHasError(true)}
                    className="block w-full h-auto max-w-none select-none"
                    draggable={false}
                  />
                )}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        <Drawer
          open
          dismissible={false}
          modal={false}
          noBodyStyles
          snapPoints={snapPoints}
          activeSnapPoint={activeSnapPoint}
          setActiveSnapPoint={setActiveSnapPoint}
          snapToSequentialPoint
          container={containerRef.current ?? undefined}
        >
          <DrawerContent
            showOverlay={false}
            portalContainer={containerRef.current}
            className="!absolute !inset-x-0 !bottom-0 !mt-0 bg-background/95 backdrop-blur border-t"
            style={{
              marginTop: 0,
              height: containerHeight ? `${containerHeight}px` : '100%',
              maxHeight: containerHeight ? `${containerHeight}px` : '100%',
            }}
          >
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-sm font-semibold">Items</DrawerTitle>
              <div className="text-xs text-muted-foreground">
                {itemCountLabel}
              </div>
            </DrawerHeader>

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
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
