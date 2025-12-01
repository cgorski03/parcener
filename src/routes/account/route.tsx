import { AccountUploadsSection } from "@/components/account/upload-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { authClient } from '@/lib/auth-client';
import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { ChevronRight, LogOut, Plus, Receipt, Ticket, Lock, Copy } from "lucide-react";
import { useState } from "react";

// --- MOCK DATA ---
const useMockRateLimit = (canUploadMock: boolean) => {
    return {
        data: {
            canUpload: canUploadMock,
            limit: 3,
            used: 1,
            resetInHours: 14,
            planName: canUploadMock ? "Early Adopter" : "Guest",
            invitesRemaining: 2 // New field: How many friends they can invite
        }
    };
};

const useMockHistory = () => {
    return {
        data: [
            { id: '1', title: 'Square Peg Pizza', date: 'Oct 24', total: 45.20, role: 'Owner' },
            { id: '2', title: 'Walmart Grocery', date: 'Oct 22', total: 112.50, role: 'Owner' },
            { id: '3', title: 'Saturday Brunch', date: 'Oct 18', total: 85.00, role: 'Participant' },
        ]
    };
};

export const Route = createFileRoute('/account')({
    component: RouteComponent,
})

function RouteComponent() {
    const { data: session, isPending } = authClient.useSession();

    // DEV TOGGLE: Set to false to see the "Invite Code Required" view
    const [mockCanUpload] = useState(true);

    const { data: rateLimit } = useMockRateLimit(mockCanUpload);
    const { data: history } = useMockHistory();

    if (!isPending && !session) {
        throw redirect({ to: '/' });
    }
    if (isPending) return null;

    const user = session?.user;

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
                            <Badge variant={rateLimit.canUpload ? "default" : "outline"} className="rounded-full text-[10px] h-5 px-2 shadow-none border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
                                {rateLimit.planName}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    </div>
                </div>

                <AccountUploadsSection />
                {/* 3. Recent Receipts 
                    Fixed: Compact rows, smaller icons, tighter spacing.
                */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between pl-1">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Recent Receipts
                        </h3>
                        {rateLimit.canUpload && (
                            <Link
                                to="/scan"
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                                Scan New <Plus className="h-3 w-3" />
                            </Link>
                        )}
                    </div>

                    <div className="bg-background rounded-xl border shadow-sm divide-y">
                        {history?.map((item) => (
                            <Link
                                key={item.id}
                                to={`/receipt/review/${item.id}`}
                                className="flex items-center p-3 hover:bg-muted/50 transition-colors group"
                            >
                                {/* Compact Icon */}
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 border">
                                    <Receipt className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>

                                {/* Info - Horizontal Layout */}
                                <div className="ml-3 flex-1 min-w-0 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-medium truncate text-foreground">{item.title}</h4>
                                        <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                                            <span>{item.date}</span>
                                            {item.role !== 'Owner' && (
                                                <>
                                                    <span className="mx-1.5">•</span>
                                                    <span>Shared with you</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-semibold">${item.total.toFixed(2)}</div>
                                    </div>
                                </div>

                                <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-2 shrink-0 group-hover:text-muted-foreground transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
