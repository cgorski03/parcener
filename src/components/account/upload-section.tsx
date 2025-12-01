import { useRateLimit } from "@/hooks/use-account"
import { Card, CardContent } from "../ui/card";
import { CanUploadRateLimitResponse, RateLimitResponse } from "@/server/account/account-service";
import { Ticket, Lock, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";


const canUploadHelper = (
    response: RateLimitResponse | undefined
): response is CanUploadRateLimitResponse => {
    if (!response) return false;
    return !('canUpload' in response);
};

export function AccountUploadsSection() {
    const { data: rateLimit, isLoading: rateLimitLoading } = useRateLimit();

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                Membership Status
            </h3>
            {
                canUploadHelper(rateLimit) ? ( /* CASE A: HAS ACCESS */
                    <Card className="py-0 border shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            {/* Upload Limits */}
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="text-sm font-medium">Receipt Uploads</div>
                                    <div className="text-xs text-muted-foreground">
                                        Resets at 00:00 UTC
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Progress value={(rateLimit.used / rateLimit.limit) * 100} className="h-1.5" />
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                        <span>{rateLimit.used} / {rateLimit.limit} used</span>
                                        <span>Daily Limit</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* The "Gatekeeper" Invite UI */}
                            <div className="bg-gradient-to-b from-indigo-50/50 to-background flex flex-col gap-4 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 shrink-0">
                                        <Ticket className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        <div>
                                            <h4 className="text-sm font-semibold text-indigo-950">Share Access</h4>
                                            <p className="text-xs text-indigo-900/70 mt-0.5 leading-relaxed">
                                                Parcener is invite-only. You can create invitations to share with friends.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-8 text-xs">
                                    Create an Invitation<Copy className="ml-2 h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* CASE B: NEEDS ACCESS */
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
                )
            }
        </div >
    )
}
