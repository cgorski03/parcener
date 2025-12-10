import { AccountUploadsSection } from "@/components/account/upload-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRecentReceipts } from "@/hooks/useGetReceipt";
import { authClient } from '@/lib/auth-client';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight, LogOut, Plus, Receipt } from "lucide-react";

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

                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm relative z-10">
                        <AvatarImage src={user?.image || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                            {user?.name?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 relative z-10">
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
                    </>
                )}
            </div>
        </div>
    );
}

function RecentUploads() {
    const { data: recentReceipts, isLoading } = useRecentReceipts();

    // Loading State
    if (isLoading) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Recent Receipts
                    </h3>
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="bg-background rounded-xl border shadow-sm divide-y">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center p-3 animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-muted" />
                            <div className="ml-3 flex-1">
                                <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                                <div className="h-3 bg-muted rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty State
    if (!recentReceipts?.length) {
        return (
            <div className="bg-background rounded-xl border shadow-sm p-6 text-center space-y-4">
                <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <div>
                    <p className="text-sm font-medium text-foreground mb-1">No receipts yet</p>
                    <p className="text-xs text-muted-foreground mb-4">Start splitting bills with friends</p>
                </div>
                <Link to="/upload" className="block">
                    <Button className="w-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
                        Scan Your First Receipt
                    </Button>
                </Link>
            </div>
        );
    }

    // Success State
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between pl-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Receipts
                </h3>

                {/* TOUCH-FRIENDLY ADD BUTTON */}
                <Link to="/upload">
                    <Button
                        variant="link"
                        size="sm"
                        className="px-3 rounded-full text-primary hover:bg-primary/10 hover:border-primary/30 border-dashed text-xs font-medium"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Scan New
                    </Button>
                </Link>
            </div>
            <div className="bg-background rounded-xl border shadow-sm divide-y">
                {recentReceipts.map((receipt) => (
                    <Link
                        key={receipt.receiptId}
                        to={`/receipt/review/${receipt.id}`}
                        className="flex items-center p-3 hover:bg-muted/50 transition-colors group"
                    >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 border">
                            <Receipt className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>

                        <div className="ml-3 flex-1 min-w-0 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <h4 className="text-sm font-medium truncate text-foreground">{receipt.title}</h4>
                                <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                                    <span>{receipt.createdAt?.toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <div className="text-sm font-semibold">${receipt.grandTotal.toFixed(2)}</div>
                            </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-2 shrink-0 group-hover:text-muted-foreground transition-colors" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
