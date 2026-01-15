import { AppNavigation } from './app-navigation';
import { Logo } from './logo';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface AppHeaderProps {
  title?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  bottom?: ReactNode;
  className?: string;
  hideNav?: boolean;
  centerTitle?: boolean;
}

export function BrandTitle({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 text-foreground/80">
      <Logo size={size} />
      <span className="text-lg font-bold tracking-tight">Parcener</span>
    </div>
  );
}

export function AppHeader({
  title,
  left,
  right,
  bottom,
  className,
  hideNav = false,
  centerTitle = false,
}: AppHeaderProps) {
  const leftContent = left || (!hideNav && <AppNavigation />);
  const displayTitle = title ?? <BrandTitle />;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60',
        className,
      )}
    >
      <div className="flex min-h-[3.5rem] items-center px-4 relative py-2">
        {/* Left Side */}
        <div className="flex items-center shrink-0 z-10">{leftContent}</div>

        {/* Title - defaults to Parcener branding if not provided */}
        {centerTitle ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto font-semibold text-lg leading-none">
              {displayTitle}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0 px-3">
            <div className="font-semibold text-lg leading-none truncate">
              {displayTitle}
            </div>
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-2 shrink-0 ml-auto z-10">
          {right}
        </div>
      </div>

      {bottom && (
        <div className="pb-3 animate-in slide-in-from-top-2 fade-in duration-300">
          {bottom}
        </div>
      )}
    </header>
  );
}
