import { useSuspenseQuery } from "@tanstack/react-query";
import { uploadRateLimitOptions } from "../hooks/use-upload-receipt";
import { Lock } from 'lucide-react';
import { Progress } from "@/shared/components/ui/progress";
import { AppUser } from "@/shared/server/db";

export function AccountUploadsSection({ user }: { user: AppUser }) {
    const { data: uploadData } = useSuspenseQuery(uploadRateLimitOptions);

    if (!user.canUpload) {
        return (
            <div className="bg-muted/30 p-5 text-center space-y-4">
                <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto border shadow-sm text-muted-foreground">
                    <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">Invitation Required</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed px-4">
                        To control costs and quality, uploading receipts is currently restricted.
                        <br /><span className="font-medium text-foreground">Ask a friend for an invite link.</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            <div className="flex justify-between items-end">
                <div className="text-sm font-medium">Receipt Uploads</div>
                <div className="text-xs text-muted-foreground">Resets at 00:00 UTC</div>
            </div>
            <div className="space-y-1.5">
                <Progress
                    value={(uploadData.used / uploadData.limit) * 100}
                    className="h-1.5"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span>{uploadData.used} / {uploadData.limit} used</span>
                    <span>Daily Limit</span>
                </div>
            </div>
        </div>
    );
}
