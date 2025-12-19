import { useCreateInvitation, useInviteRateLimit, useUploadRateLimit } from "@/hooks/use-account"
import { Card, CardContent } from "../ui/card";
import { Ticket, Lock, Loader2, CheckCircle2, Share, } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { useState } from "react";
import { QrShareSheet } from "../common/qr-code-shareable-sheet";

export function AccountUploadsSection() {
    const { data: uploadData, isLoading: isUploadLoading } = useUploadRateLimit();

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
                <Card className="py-0 shadow-sm overflow-hidden">
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
                        <InviteSection />
                    </CardContent>
                </Card>
            ) : (
                /* CASE B: NO ACCESS (Needs Invite) */
                <Card className="py-0 shadow-sm overflow-hidden border-dashed">
                    <CardContent className="p-0">
                        <div className="bg-muted/30 p-5 text-center space-y-4">
                            <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto border shadow-sm text-muted-foreground">
                                <Lock className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold text-foreground">Invitation Required</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed px-4">
                                    To control costs and quality, uploading receipts is currently restricted.
                                    <br /><span className="font-medium text-foreground">Ask a friend on Parcener for an invite link.</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}


export function InviteSection() {
    const { data: inviteData, isLoading: isQueryLoading } = useInviteRateLimit();
    const { mutate: createInvitation, isPending: isMutationPending } = useCreateInvitation();

    // State for the QR sheet
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string>("");

    // Determine state
    const isMaxedOut = inviteData ? inviteData.used >= inviteData.limit : false;
    const isDisabled = isQueryLoading || !inviteData?.canInvite || isMaxedOut || isMutationPending;

    // Determine button text/icon
    const getButtonContent = () => {
        if (isMutationPending) return <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Creating...</>;
        if (isQueryLoading) return <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Checking...</>;
        if (!inviteData?.canInvite) return <><Lock className="mr-2 h-3 w-3" /> Invites Locked</>;
        if (isMaxedOut) return <><CheckCircle2 className="mr-2 h-3 w-3" /> Daily Limit Reached</>;
        return <>Create an Invitation <Share className="ml-2 h-3 w-3" /></>;
    };

    const handleCreateInvite = () => {
        createInvitation(undefined, {
            onSuccess: (data) => {
                // Construct the share URL from the returned inviteId
                const url = `${window.location.origin}/acceptInvite?token=${data.inviteId}`;
                setInviteUrl(url);
                setIsSheetOpen(true);
            },
        });
    };

    return (
        <>
            <div className="bg-muted/20 flex flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                        <Ticket className="h-4 w-4" />
                    </div>
                    <div className="space-y-3 flex-1">
                        <div>
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-semibold text-foreground">Share Access</h4>
                                {inviteData && (
                                    <span className="text-[10px] font-medium bg-background border text-muted-foreground px-2 py-0.5 rounded-full shadow-sm">
                                        {inviteData.limit - inviteData.used} remaining
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                Parcener is invite-only. You can create invitations to share with friends.
                            </p>
                        </div>
                    </div>
                </div>
                <Button
                    size="sm"
                    disabled={isDisabled}
                    onClick={handleCreateInvite}
                    className="w-full text-xs shadow-sm"
                    variant={isDisabled ? "outline" : "default"}
                >
                    {getButtonContent()}
                </Button>
            </div>

            {/* Sheet opens programmatically when inviteUrl is set */}
            {inviteUrl && (
                <QrShareSheet
                    title="Invitation Created"
                    description={
                        <>
                            Share this invite link with a friend
                            <br />
                            to grant them access to Parcener.
                        </>
                    }
                    value={inviteUrl}
                    shareText="Share Invite Link"
                    open={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                />
            )}
        </>
    );
}

function AccountUploadsSkeleton() {
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                Membership Status
            </h3>
            <Card className="py-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                    <Separator />
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
