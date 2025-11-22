import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Loader2, Receipt, ArrowRight, User } from "lucide-react";
import { FullRoomInfo, joinRoomRpc } from "@/server/room/room-rpc";
import type { User as UserType } from "better-auth";
import GithubIcon from "../icons/github";
import { authClient } from "@/lib/auth-client";
import { RoomMemberAvatar } from "./room-member-avatar";

interface LobbyScreenProps {
    room: FullRoomInfo;
    user: UserType | undefined;
}

export function LobbyScreen({ room, user }: LobbyScreenProps) {
    const router = useRouter();
    const [name, setName] = useState(user?.name ?? "");

    const { mutate: joinRoom, isPending } = useMutation({
        mutationFn: async () => {
            return await joinRoomRpc({
                data: { roomId: room.id, displayName: name || null },
            });
        },
        onSuccess: (response) => {
            const cookieName = `guest_uuid_room_${room.id}`;
            const maxAge = 60 * 60 * 24 * 7;
            document.cookie = `${cookieName}=${response.generatedUuid}; path=/; max-age=${maxAge}; SameSite=Lax`;
            router.invalidate();
        },
    });

    const activeMembers = room.members.length;
    const subtotal = room.receipt?.subtotal ?? 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/*BRanding*/}
            <div className="absolute top-8 flex items-center gap-2 text-foreground/80">
                <Receipt className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight">Parcener</span>
            </div>

            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight line-clamp-2">
                            {room.title || "Untitled Receipt"}
                        </h1>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-2">
                            <span>{room.receipt?.createdAt?.toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                                ${subtotal.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {activeMembers > 0 && (
                        <div className="flex items-center justify-center gap-3 py-2">
                            <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
                                {room.members.slice(0, 5).map((m) => (
                                    <RoomMemberAvatar
                                        id={m.id}
                                        avatarUrl={m.avatarUrl}
                                        displayName={m.displayName} />
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
                    <IdentitySection user={user} name={name} setName={setName} />

                    <Button
                        size="lg"
                        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
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
                        <div className="text-xs text-center text-muted-foreground space-y-1">
                            <p>
                                Tip:{" "}
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs font-medium underline hover:text-primary"
                                    onClick={() => authClient.signIn.social({ provider: "google", callbackURL: window.location.href })}
                                >
                                    Sign in with Google
                                </Button>{" "}
                                to save this receipt to your history.
                            </p>
                        </div>
                    )}
                </CardContent>

                <div className="h-1 w-full bg-gradient-to-r from-transparent via-muted to-transparent opacity-50" />

                <CardFooter className="flex flex-col gap-4 py-6 bg-muted/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                        <GithubIcon size={16} className="text-secondary" />
                        <span>Completely free & open source</span>
                    </div>
                </CardFooter>
            </Card>

            <div className="mt-8 text-[10px] text-muted-foreground/40">
                © {new Date().getFullYear()} Parcener. Built for friends.
            </div>
        </div>
    );
}

interface IdentitySectionProps {
    user: UserType | undefined;
    name: string;
    setName: (name: string) => void;
}

function IdentitySection({ user, name, setName }: IdentitySectionProps) {
    const router = useRouter();
    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px] ml-1">
                Join as
            </label>

            {user ? (
                <div className="p-3 bg-secondary/30 rounded-xl border flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <RoomMemberAvatar
                            id={user.id}
                            avatarUrl={user.image ?? null}
                            displayName={user.name} />
                        <div className="text-left">
                            <p className="font-semibold text-sm leading-none">{name || "User"}</p>
                            <p className="text-xs text-muted-foreground mt-1">Logged in</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            authClient.signOut();
                            router.invalidate();
                        }}
                    >
                        Log Out
                    </Button>
                </div>
            ) : (
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
    );
}
