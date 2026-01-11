import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { authClient } from '@/shared/lib/auth-client';
import { Button } from '@/shared/components/ui/button';
import { BrandedPageShell } from '@/shared/components/layout/branded-page-shell';

type LoginPageProps = {
    redirectUrl?: string;
};

export function LoginPage({ redirectUrl }: LoginPageProps) {
    const [showFullUrl, setShowFullUrl] = useState(false);

    const signIn = () => {
        authClient.signIn.social({
            provider: 'google',
            callbackURL: redirectUrl || '/account',
        });
    };

    const displayUrl = redirectUrl
        ? redirectUrl.length > 50
            ? `${redirectUrl.substring(0, 50)}…`
            : redirectUrl
        : null;

    return (
        <BrandedPageShell>
            <div className="flex-1 flex flex-col items-center pt-[15vh] p-4 min-h-[550px]">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold">Welcome Back</h1>
                        <p className="text-sm text-muted-foreground">
                            Sign in to continue to your receipt
                        </p>
                    </div>

                    <Button className="h-12 w-full" onClick={signIn}>
                        Sign in with Google
                    </Button>

                    {redirectUrl && (
                        <div className="rounded-lg border bg-muted/20 p-4 transition-all duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                    You'll return to:
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs text-muted-foreground font-mono truncate">
                                    {displayUrl}
                                </code>
                            </div>

                            {redirectUrl.length > 50 && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 mt-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowFullUrl(!showFullUrl)}
                                >
                                    {showFullUrl ? (
                                        <>
                                            <ChevronUp className="h-3 w-3 mr-1" />
                                            Hide full URL
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                            Show full URL
                                        </>
                                    )}
                                </Button>
                            )}

                            <div
                                className={cn(
                                    'grid transition-all duration-300 ease-in-out',
                                    showFullUrl ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr] mt-0',
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="p-3 rounded-md border bg-background text-xs font-mono text-foreground break-all">
                                        {redirectUrl}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </BrandedPageShell>
    );
}

export function LoginPendingView() {
    return (
        <BrandedPageShell>
            <div className="flex-1 flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Checking session...</div>
            </div>
        </BrandedPageShell>
    );
}
