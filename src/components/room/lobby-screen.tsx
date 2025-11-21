import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Receipt, ArrowRight, Github, User, LogOut } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { FullRoomInfo, joinRoomRpc } from "@/server/room/room-rpc";
import type { User as UserType } from "better-auth";

interface LobbyScreenProps {
    room: FullRoomInfo;
    user: UserType | undefined;
}

export function LobbyScreen({ room, user }: LobbyScreenProps) {
    const router = useRouter();

    // Pre-fill name if logged in, otherwise blank
    const [name, setName] = useState(user?.name ?? "");
    const [isEditingName, setIsEditingName] = useState(!user?.name);
    console.log(room.members);
    // If auth state changes (e.g. loads late), update name
    useEffect(() => {
        if (user?.name) {
            setName(user.name);
            setIsEditingName(false);
        }
    }, [user]);

    const { mutate: joinRoom, isPending } = useMutation({
        mutationFn: async () => {
            return await joinRoomRpc({
                data: { roomId: room.id, displayName: name || null }
            });
        },
        onSuccess: (response) => {
            // Set cookie logic here...
            const cookieName = `guest_uuid_room_${room.id}`;
            const maxAge = 60 * 60 * 24 * 7;
            document.cookie = `${cookieName}=${response.generatedUuid}; path=/; max-age=${maxAge}; SameSite=Lax`;
            router.invalidate();
        }
    });

    // Derived state for UI
    const activeMembers = room.members.length;
    const subtotal = room.receipt?.subtotal ?? 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">

            {/* Background Decoration */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Brand Logo (Top Center) */}
            <div className="absolute top-8 flex items-center gap-2 text-foreground/80 mb-8">
                <Receipt className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight">Parcener</span>
            </div>

            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary animate-in fade-in  duration-500">
                <CardHeader className="text-center space-y-4 pb-2">
                    {/* Room Context */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight line-clamp-2">
                            {room.title || "Untitled Receipt"}
                        </h1>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2">
                            <span>{new Date().toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Social Proof / Active Members */}
                    {activeMembers > 0 && (
                        <div className="flex items-center justify-center gap-3 py-2">
                            <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
                                {room.members.slice(0, 5).map((m) => (
                                    <Avatar key={m.id} className="h-10 w-10 border-2 border-background ring-1 ring-muted shadow-sm">
                                        {m.avatarUrl && <AvatarImage src={m.avatarUrl} />}
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                            {m.displayName?.substring(0, 2).toUpperCase() ?? "G"}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {activeMembers > 5 && (
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs font-medium text-muted-foreground z-10">
                                        +{activeMembers - 5}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                already here
                            </span>
                        </div>
                    )}
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    {/* Identity Section */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px] ml-1">
                            Join as
                        </label>

                        {user ? (
                            // AUTHENTICATED VIEW
                            <div className="p-3 bg-secondary/30 rounded-xl border flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border shadow-sm">
                                        {user.image && <AvatarImage src={user.image} />}
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                            {user.name?.[0] ?? <User className="h-4 w-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <p className="font-semibold text-sm leading-none">
                                            {name || "User"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Logged in
                                        </p>
                                    </div>
                                </div>
                                {/* Allow editing name even if logged in? Optional. */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => { /* Add logout logic or switch account logic */ }}
                                >
                                    Change
                                </Button>
                            </div>
                        ) : (
                            // GUEST VIEW
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                                <Input
                                    placeholder="Enter your name..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 h-12 text-base bg-background"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>

                    <Button
                        size="lg"
                        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all  "
                        onClick={() => joinRoom()}
                        disabled={isPending || (!name && !user)}
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Join Bill Split
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>

                    {!user && (
                        <p className="text-xs text-center text-muted-foreground">
                            Tip: <span className="underline cursor-pointer hover:text-primary">Log in</span> to save this receipt to your history.
                        </p>
                    )}
                </CardContent>

                {/* Visual Separator for Design */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-muted to-transparent opacity-50" />

                <CardFooter className="flex flex-col gap-4 py-6 bg-muted/10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                            <Github className="h-3.5 w-3.5" />
                            <span>Completely free & open source</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            {/* Bottom Legal/Copyright (Optional) */}
            <div className="mt-8 text-[10px] text-muted-foreground/40">
                © {new Date().getFullYear()} Parcener. Built for friends.
            </div>
        </div>
    );
}
