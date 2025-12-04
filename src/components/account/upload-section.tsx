import { useInviteRateLimit, useUploadRateLimit } from "@/hooks/use-account"
import { Card, CardContent } from "../ui/card";
import { Ticket, Lock, Copy, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton"

export function AccountUploadsSection() {
    const { data: uploadData, isLoading: isUploadLoading } = useUploadRateLimit();
    const { data: inviteData, isLoading: isInviteLoading } = useInviteRateLimit();
    console.log(inviteData)

    // prevent UI flashing or crashing while initial data fetches
    if (isUploadLoading) {
        return <AccountUploadsSkeleton />
    }

    const hasAccess = uploadData?.canUpload;

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                Membership Status
            </h3>

            {hasAccess ? (
                /* CASE A: HAS ACCESS */
                <Card className="py-0 border shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        {/* Upload Limits Section */}
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="text-sm font-medium">Receipt Uploads</div>
                                <div className="text-xs text-muted-foreground">
                                    Resets at 00:00 UTC
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Progress
                                    value={uploadData ? (uploadData.used / uploadData.limit) * 100 : 0}
                                    className="h-1.5"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                    <span>{uploadData?.used ?? 0} / {uploadData?.limit ?? 0} used</span>
                                    <span>Daily Limit</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Invite Section */}
                        <InviteSection
                            inviteData={inviteData}
                            isLoading={isInviteLoading}
                        />
                    </CardContent>
                </Card>
            ) : (
                /* CASE B: NO ACCESS (Needs Invite) */
                <Card className="py-0 border border-amber-200 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="bg-amber-50/50 p-5 text-center space-y-4">
                            <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-amber-600">
                                <Lock className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold text-amber-950">Invitation Required</h4>
                                <p className="text-xs text-amber-800/80 leading-relaxed px-4">
                                    To control costs and quality, uploading receipts is currently restricted.
                                    <br /><span className="font-medium">Ask a friend on Parcener for an invite link.</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function InviteSection({
    inviteData,
    isLoading
}: {
    inviteData: { canInvite: boolean; used: number; limit: number } | undefined,
    isLoading: boolean
}) {
    // Determine state
    const isMaxedOut = inviteData ? inviteData.used >= inviteData.limit : false;
    const isDisabled = isLoading || !inviteData?.canInvite || isMaxedOut;

    // Determine button text/icon
    const getButtonContent = () => {
        if (isLoading) return <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Checking...</>;
        if (!inviteData?.canInvite) return <><Lock className="mr-2 h-3 w-3" /> Invites Locked</>;
        if (isMaxedOut) return <><CheckCircle2 className="mr-2 h-3 w-3" /> Daily Limit Reached</>;
        return <>Create an Invitation <Copy className="ml-2 h-3 w-3" /></>;
    };

    return (
        <div className="bg-gradient-to-b from-indigo-50/50 to-background flex flex-col gap-4 p-4">
            <div className="flex items-start gap-3">
                <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 shrink-0">
                    <Ticket className="h-4 w-4" />
                </div>
                <div className="space-y-3 flex-1">
                    <div>
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-semibold text-indigo-950">Share Access</h4>
                            {inviteData && (
                                <span className="text-[10px] font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                    {inviteData.limit - inviteData.used} remaining
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-indigo-900/70 mt-0.5 leading-relaxed">
                            Parcener is invite-only. You can create invitations to share with friends.
                        </p>
                    </div>
                </div>
            </div>
            <Button
                size="sm"
                disabled={isDisabled}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-8 text-xs disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {getButtonContent()}
            </Button>
        </div>
    );
}

function AccountUploadsSkeleton() {
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                Membership Status
            </h3>
            <Card className="py-0 border shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                    <Separator />
                    <div className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
