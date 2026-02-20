import { useState } from 'react';
import { Image, List } from 'lucide-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { ReceiptImageItemsDrawer } from './receipt-image-items-drawer';
import { Button } from '@/shared/components/ui/button';

interface ReceiptImageViewerProps {
  receiptId: string;
}

const IMAGE_HEIGHT_RATIO = 0.55;
const MIN_IMAGE_HEIGHT = 220;

export function ReceiptImageViewer({ receiptId }: ReceiptImageViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const imageFlexBasis = showItems ? `${IMAGE_HEIGHT_RATIO * 100}%` : '100%';

  return (
    <div className="relative flex-1 min-h-0 h-full w-full overflow-hidden flex flex-col">
      <div
        className="relative w-full overflow-hidden min-h-0 flex-shrink-0"
        style={{
          flexBasis: imageFlexBasis,
          flexGrow: showItems ? 0 : 1,
          minHeight: `${MIN_IMAGE_HEIGHT}px`,
        }}
      >
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={4}
          centerOnInit
          panning={{ velocityDisabled: true }}
        >
          <>
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 shadow-sm backdrop-blur">
              <Image className="size-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Receipt View
              </span>
            </div>
            <div className="absolute top-3 right-3 z-20">
              <Button
                size="sm"
                className="!h-auto !rounded-full border bg-background/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur hover:bg-background/90"
                onClick={() => setShowItems((current) => !current)}
              >
                <List className="size-4 text-muted-foreground" />
                {showItems ? 'Hide Items' : 'Show Items'}
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
        </TransformWrapper>
      </div>

      {showItems && (
        <div className="w-full flex flex-col min-h-0 flex-1 bg-background/95 backdrop-blur border-t">
          <ReceiptImageItemsDrawer receiptId={receiptId} />
        </div>
      )}
    </div>
  );
}
