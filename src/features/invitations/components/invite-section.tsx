import { useState } from 'react';
import {
    useCreateInvitation,
    inviteRateLimitOptions,
} from '../hooks/use-invitations';
import { CheckCircle2, Loader2, Lock, Share, Ticket } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { QrShareSheet } from '@/shared/components/common/qr-code-shareable-sheet';
import { useSuspenseQuery } from '@tanstack/react-query';

export function InviteSection() {
    const { data: inviteData } = useSuspenseQuery(inviteRateLimitOptions);
    const { mutate: createInvitation, isPending: isMutationPending } =
        useCreateInvitation();

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string>('');

    const isMaxedOut = inviteData.used >= inviteData.limit;
    const isDisabled = !inviteData.canInvite || isMaxedOut || isMutationPending;

    // Determine button text/icon
    const getButtonContent = () => {
        if (isMutationPending)
            return (
                <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Creating...
                </>
            );
        if (!inviteData?.canInvite)
            return (
                <>
                    <Lock className="mr-2 h-3 w-3" /> Invites Locked
                </>
            );
        if (isMaxedOut)
            return (
                <>
                    <CheckCircle2 className="mr-2 h-3 w-3" /> Daily Limit Reached
                </>
            );
        return (
            <>
                Create an Invitation <Share className="ml-2 h-3 w-3" />
            </>
        );
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
                                <h4 className="text-sm font-semibold text-foreground">
                                    Share Access
                                </h4>
                                {inviteData && (
                                    <span className="text-[10px] font-medium bg-background border text-muted-foreground px-2 py-0.5 rounded-full shadow-sm">
                                        {inviteData.limit - inviteData.used} remaining
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                Parcener is invite-only. You can create invitations to share
                                with friends.
                            </p>
                        </div>
                    </div>
                </div>
                <Button
                    size="sm"
                    disabled={isDisabled}
                    onClick={handleCreateInvite}
                    className="w-full text-xs shadow-sm"
                    variant={isDisabled ? 'outline' : 'default'}
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
