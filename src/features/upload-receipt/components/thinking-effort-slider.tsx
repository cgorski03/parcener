import { useRef, useState } from 'react';
import { Scale, ScanSearch, Zap } from 'lucide-react';

import type { GoogleThinkingLevel } from '../server/types';

import { cn } from '@/shared/lib/utils';

interface ThinkingEffortSliderProps {
  value: GoogleThinkingLevel;
  onChange: (value: GoogleThinkingLevel) => void;
  disabled?: boolean;
}

const LEVELS = [
  { value: 'low', label: 'Speed', icon: Zap, position: 0 },
  { value: 'medium', label: 'Balanced', icon: Scale, position: 50 },
  { value: 'high', label: 'Precision', icon: ScanSearch, position: 100 },
] as const;

const MODE_DESCRIPTIONS: Record<GoogleThinkingLevel, string> = {
  low: 'Fast processing',
  medium: 'Recommended',
  high: 'Max accuracy',
};

function valueToPosition(value: GoogleThinkingLevel): number {
  return LEVELS.find((l) => l.value === value)?.position ?? 50;
}

function positionToValue(position: number): GoogleThinkingLevel {
  const closest = LEVELS.reduce((prev, curr) =>
    Math.abs(curr.position - position) < Math.abs(prev.position - position)
      ? curr
      : prev,
  );
  return closest.value;
}

export function ThinkingEffortSlider({
  value,
  onChange,
  disabled,
}: ThinkingEffortSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(() => valueToPosition(value));
  const [prevValue, setPrevValue] = useState(value);

  // Sync local position when prop changes (derived state pattern)
  if (value !== prevValue && !isDragging) {
    setPrevValue(value);
    setLocalPosition(valueToPosition(value));
  }

  const getPositionFromEvent = (clientX: number): number => {
    if (!trackRef.current) return localPosition;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    return Math.max(0, Math.min(100, percent));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setLocalPosition(getPositionFromEvent(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setLocalPosition(getPositionFromEvent(e.clientX));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
    const finalPosition = getPositionFromEvent(e.clientX);
    const snappedValue = positionToValue(finalPosition);
    setLocalPosition(valueToPosition(snappedValue));
    setPrevValue(snappedValue);
    onChange(snappedValue);
  };

  const handleLabelClick = (level: (typeof LEVELS)[number]) => {
    if (disabled) return;
    setLocalPosition(level.position);
    setPrevValue(level.value);
    onChange(level.value);
  };

  return (
    <div
      className={cn(
        'w-full space-y-3 pt-2',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium">Processing Mode</span>
        <span
          key={value}
          className="animate-in fade-in slide-in-from-bottom-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground duration-200"
        >
          {MODE_DESCRIPTIONS[value]}
        </span>
      </div>

      {/* Slider */}
      <div className="px-5 pb-6 pt-4">
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative flex h-6 cursor-pointer touch-none items-center"
        >
          {/* Track background */}
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-muted" />

          {/* Filled track */}
          <div
            className="absolute left-0 h-1.5 rounded-full bg-primary"
            style={{
              width: `${localPosition}%`,
              transition: isDragging
                ? 'none'
                : 'width 200ms cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          />

          {/* Thumb */}
          <div
            className={cn(
              'absolute -ml-2 size-4 rounded-full border-2 border-primary bg-background shadow-sm',
              'hover:ring-4 hover:ring-ring/50',
              isDragging && 'scale-110 ring-4 ring-ring/50',
            )}
            style={{
              left: `${localPosition}%`,
              transition: isDragging
                ? 'transform 100ms, box-shadow 100ms'
                : 'left 200ms cubic-bezier(0.25, 1, 0.5, 1), transform 100ms, box-shadow 100ms',
            }}
          />
        </div>

        {/* Labels */}
        <div className="relative mt-4 h-8 w-full select-none">
          {LEVELS.map((level) => {
            const Icon = level.icon;
            const isSelected = value === level.value;

            return (
              <button
                key={level.value}
                type="button"
                disabled={disabled}
                onClick={() => handleLabelClick(level)}
                className={cn(
                  'absolute flex -translate-x-1/2 cursor-pointer flex-col items-center gap-1.5 transition-colors duration-200 focus:outline-none',
                  isSelected
                    ? 'text-primary'
                    : 'text-muted-foreground/60 hover:text-muted-foreground',
                )}
                style={{ left: `${level.position}%` }}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform duration-200 ease-out',
                    isSelected
                      ? 'scale-110 stroke-[2.5px]'
                      : 'group-hover:scale-110',
                  )}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {level.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
