import { Link } from '@tanstack/react-router';
import { AppHeader, BrandTitle } from './app-header';
import { CardFooter } from '@/shared/components/ui/card';
import GitHubIcon from '@/shared/components/icons/github';
import { cn } from '@/shared/lib/utils';

interface BrandedPageShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-page shell for entry/landing pages (login, lobby, upload).
 * - Fixed height (no scroll) for native feel
 * - Centered branding header (no nav drawer)
 * - Background decorations + footer
 */
export function BrandedPageShell({
  children,
  className,
}: BrandedPageShellProps) {
  return (
    <div
      className={cn(
        'h-screen flex flex-col overflow-hidden bg-gradient-to-b from-muted/40 to-background relative',
        className,
      )}
    >
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Centered Logo - No nav drawer for entry pages */}
      <AppHeader hideNav centerTitle title={<BrandTitle size={28} />} />

      {/* Main content - centered, no scroll */}
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center w-full p-4 overflow-hidden"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 py-4 text-center px-4">
        <div className="text-[10px] text-muted-foreground/40 w-full max-w-md mx-auto">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-muted to-transparent opacity-50" />
          <CardFooter className="flex flex-col gap-4 py-6 bg-muted/10 rounded-lg mt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
              <GitHubIcon size={16} className="text-secondary" />
              <span>Completely free & open source</span>
            </div>
          </CardFooter>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link
              to="/terms"
              className="hover:text-muted-foreground transition-colors"
            >
              Terms
            </Link>
            <span>·</span>
            <Link
              to="/privacy"
              className="hover:text-muted-foreground transition-colors"
            >
              Privacy
            </Link>
            <span>·</span>
            <span>© {new Date().getFullYear()} Parcener</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
