import { RecentRooms } from "@/components/account/recent-rooms";
import { RecentUploads } from "@/components/account/recent-uploads";
import { AccountUploadsSection } from "@/components/account/upload-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authClient } from '@/lib/auth-client';
import { createFileRoute } from '@tanstack/react-router';
import { LogOut } from "lucide-react";

export const Route = createFileRoute('/_authed/account')({
    component: RouteComponent,
})

function RouteComponent() {
    const { user } = Route.useRouteContext();

    return (
        <div className="min-h-screen bg-muted/20 pb-20 font-sans">
            {/* Header */}
            <div className="bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <h1 className="font-semibold text-lg tracking-tight">Account</h1>
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-xs hover:text-destructive" onClick={() => authClient.signOut()}>
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    Sign Out
                </Button>
            </div>

            <div className="container max-w-md mx-auto p-4 space-y-5">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background rounded-xl border shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
                    {/* Decorative blur blob for extra texture */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />

                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm relative z-3">
                        <AvatarImage src={user?.image || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                            {user?.name?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 relative z-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg truncate pr-2">{user?.name}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    </div>
                </div>

                {user?.canUpload && (
                    <>
                        <AccountUploadsSection />
                        <RecentUploads />
                        <RecentRooms />
                    </>
                )}
            </div>
        </div>
    );
}

