import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Receipt, ArrowRight } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { joinRoomRpc } from "@/server/room/room-rpc"; // The mutation version

export function LobbyScreen({ room }: { room: any }) {
    const router = useRouter();
    const [name, setName] = useState("");

    const { mutate: joinRoom, isPending } = useMutation({
        mutationFn: async () => {
            // 1. Call Server to create Member
            // Note: Pass 'name' if they typed one, or blank for "Guest"
            return await joinRoomRpc({
                data: { roomId: room.id, displayName: name || undefined }
            });
        },
        onSuccess: (response) => {
            // 2. Set Cookie (Critical Step)
            const cookieName = `guest_uuid_room_${room.id}`;
            const maxAge = 60 * 60 * 24 * 7;
            document.cookie = `${cookieName}=${response.generatedUuid}; path=/; max-age=${maxAge}; SameSite=Lax`;

            // 3. Reload the route to trigger the Loader again
            // Since the cookie is now set, the Loader will find the member and render ActiveRoomScreen
            router.invalidate();
        }
    });

    return (
        <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 space-y-6 shadow-xl border-t-4 border-t-primary">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {room.title || "Bill Split"}
                    </h1>
                    <div className="text-sm text-muted-foreground">
                        {room.receipt.items.length} items • ${room.receipt.grandTotal.toFixed(2)} total
                    </div>
                </div>

                {/* Quick Form */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your Name (Optional)</label>
                        <Input
                            placeholder="e.g. John D."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-lg"
                        />
                    </div>

                    <Button
                        size="lg"
                        className="w-full text-base"
                        onClick={() => joinRoom()}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Join Bill
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        No account required.
                    </p>
                </div>
            </Card>
        </div>
    );
}
