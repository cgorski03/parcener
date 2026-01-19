import { Link } from '@tanstack/react-router';
import { ArrowRight, Lock, ScanLine, Shield, Zap } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import GitHubIcon from '@/shared/components/icons/github';
import { authClient } from '@/shared/lib/auth-client';

// --- Real App Components ---
import { BaseReceiptItemCard } from '@/shared/components/item-card/base-receipt-item-card';
import { PriceBreakdown } from '@/shared/components/price-breakdown';
import { VimConfigCard } from '@/features/landing/components/vim-config-card';
import { InteractiveDemo } from '@/features/landing/components/interactive-demo';
import { RealtimeSimulation } from '@/features/landing/components/realtime-simulation';
import { AccessCTA } from '@/features/landing/components/acess-cta';
import { BrandTitle } from '@/shared/components/layout/app-header';

export function LandingPage() {
  const { data: session } = authClient.useSession();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Parcener',
    description:
      'Open source collaborative receipt splitting tool. Split bills, not friends.',
    url: 'https://parcener.app',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/20">
        {/* Grid Background */}
        <div className="absolute top-0 inset-x-0 h-[85vh] z-0 pointer-events-none">
          <div
            className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
            style={{
              maskImage:
                'linear-gradient(to bottom, black 40%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, black 40%, transparent 100%)',
            }}
          />
        </div>

        {/* Navigation */}
        <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <BrandTitle />
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/cgorski03/parcener"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitHubIcon size={16} />
              <span className="font-mono text-xs">cgorski03/parcener</span>
            </a>
            {session ? (
              <Link to="/account" preload="render">
                <Button
                  size="sm"
                  className="rounded-full px-5 font-semibold h-9"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login" preload="intent">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-5 h-9 bg-background/50 backdrop-blur-sm hover:bg-muted font-medium"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </nav>

        <main id="main-content" className="relative z-10 pt-20 pb-24">
          {/* --- HERO SECTION --- */}
          <div className="max-w-7xl mx-auto px-6 text-center space-y-8 mb-24">
            <div className="space-y-6">
              <Badge
                variant="secondary"
                className="px-3 py-1 rounded-full text-xs font-medium border border-primary/10 bg-primary/5 text-primary"
              >
                <Lock className="w-3 h-3 mr-2" />
                Private Beta
              </Badge>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-foreground max-w-4xl mx-auto leading-[0.95]">
                Split bills, <br />
                <span className="text-muted-foreground">keep friends.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                The open source, collaborative, receipt splitter. Scan a
                receipt, tap your items, and settle up.{' '}
                <br className="hidden md:block" />
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
                <Link to={session ? '/account' : '/login'} preload="render">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base rounded-full shadow-sm hover:bg-primary/90 transition-all"
                  >
                    {session ? 'Go to Dashboard' : 'Start Splitting'}{' '}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="https://github.com/cgorski03/parcener"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-12 px-8 text-base rounded-full hover:bg-muted/50"
                  >
                    <GitHubIcon className="mr-2 h-4 w-4" /> Open Source
                  </Button>
                </a>
              </div>
            </div>

            <InteractiveDemo />
          </div>

          {/* --- DEFINITION SECTION --- */}
          <div className="max-w-2xl mx-auto px-6 mb-32 text-center py-24 border-y border-border/40 bg-background">
            <div className="inline-block relative">
              <h2 className="text-4xl font-serif italic font-medium text-foreground mb-2">
                Parcener
              </h2>
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground font-mono mb-4">
                <span>/ˈpɑːsənə/</span>
                <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>noun</span>
                <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>archaic</span>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                "A joint heir; a person who holds property equally with
                another."
              </p>
            </div>
          </div>

          {/* --- FEATURE SECTION --- */}
          <div className="max-w-7xl mx-auto px-6 mb-32">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1: The Engine */}
              <div className="border bg-card rounded-xl p-8 flex flex-col justify-between h-full min-h-[400px]">
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-blue-500/10 text-blue-600 rounded-lg flex items-center justify-center">
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">
                    Precision OCR
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    AI extracts line items, prices, and quantities. You get a
                    dedicated review screen to fix errors or add tip before the
                    room opens.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-dashed">
                  <div className="space-y-2 opacity-90 pointer-events-none select-none">
                    <BaseReceiptItemCard
                      item={{
                        receiptItemId: 'demo',
                        quantity: 2,
                        interpretedText: 'Old Fashioned',
                        price: 28.0,
                        rawText: '2 OLD FASH',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Feature 2: Realtime */}
              <div className="md:col-span-2 border bg-card rounded-xl p-8 flex flex-col md:flex-row gap-8 overflow-hidden">
                <div className="flex-1 space-y-4">
                  <div className="h-10 w-10 bg-orange-500/10 text-orange-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">
                    Real-time Sync
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    See exactly who claims what as it happens, without
                    refreshing. Perfect for spotty restaurant Wi-Fi.
                  </p>
                </div>

                <div className="flex-1 flex items-center justify-center md:justify-end">
                  <div className="w-full max-w-sm bg-background border z-100 overflow-hidden rounded-lg shadow-sm  pointer-events-none select-none">
                    <RealtimeSimulation />
                  </div>
                </div>
              </div>

              {/* Feature 3: Math */}
              <div className="md:col-span-2 border bg-card rounded-xl p-8 flex flex-col md:flex-row gap-8">
                <div className="flex-1 order-2 md:order-1 flex items-center justify-center md:justify-start">
                  <div className="w-full max-w-[280px]">
                    <PriceBreakdown
                      label="Eliza's Share"
                      subtotal={45.0}
                      tax={3.6}
                      tip={9.0}
                      grandTotal={57.6}
                      className="border-border shadow-none"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-4 order-1 md:order-2">
                  <div className="h-10 w-10 bg-green-500/10 text-green-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">
                    Fair Settlement
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Tax and tip are distributed proportionally based on the
                    subtotal of items claimed. We handle the math so you don't
                    have to argue about who owes the extra $2.
                  </p>
                </div>
              </div>

              {/*  Interactive Vim Card */}
              <VimConfigCard />
            </div>
          </div>

          {/* --- ACCESS SECTION --- */}
          <AccessCTA />
        </main>

        <footer className="py-12 border-t border-border/40 bg-background">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <BrandTitle />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link
                to="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <span>·</span>
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <span>·</span>
              <span>
                © {new Date().getFullYear()} Parcener. MIT License.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/cgorski03/parcener"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
