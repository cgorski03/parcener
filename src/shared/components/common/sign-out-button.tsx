import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { authClient } from "@/shared/lib/auth-client";
import { logger } from "@/shared/observability/logger";
import { SENTRY_EVENTS } from "@/shared/observability/sentry-events";

export function SignOutButton() {
    const navigate = useNavigate();
    const [isPending, setIsPending] = useState(false);

    const onSignOut = async () => {
        try {
            setIsPending(true);
            await authClient.signOut();

            logger.info("User logged out successfully", SENTRY_EVENTS.AUTH.SIGN_OUT);

            // Navigate to landing page after successful logout
            await navigate({ to: "/" });
        } catch (error) {
            logger.error(error, SENTRY_EVENTS.AUTH.SIGN_OUT);
            setIsPending(false); // Only reset if it fails, otherwise we're navigating away
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            className="text-muted-foreground text-xs hover:text-destructive transition-colors"
            onClick={onSignOut}
        >
            {isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isPending ? "Signing Out..." : "Sign Out"}
        </Button>
    );
}
