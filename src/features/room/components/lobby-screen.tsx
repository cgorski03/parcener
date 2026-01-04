import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Loader2, ArrowRight, User } from 'lucide-react'
import type { User as UserType } from 'better-auth'
import { authClient } from '@/shared/lib/auth-client'
import { RoomMemberAvatar } from './room-member-avatar'
import type { FullRoomInfoDto } from '@/shared/dto/types'
import { BrandedPageShell } from '@/shared/components/layout/branded-page-shell'
import { useJoinRoom } from '@/features/room/hooks/use-room'

interface LobbyScreenProps {
    room: FullRoomInfoDto
    user: UserType | undefined
}

export function LobbyScreen({ room, user }: LobbyScreenProps) {
    const [name, setName] = useState(user?.name ?? '')
    const { joinRoom, isPending } = useJoinRoom()

    const activeMembers = room.members.length
    const subtotal = room.receipt?.subtotal ?? 0

    return (
        <BrandedPageShell>
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight line-clamp-2">
                            {room.title || 'Untitled Receipt'}
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
                                        key={m.roomMemberId}
                                        id={m.roomMemberId}
                                        avatarUrl={m.avatarUrl}
                                        displayName={m.displayName}
                                    />
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
                        onClick={() => joinRoom({ roomId: room.roomId, displayName: name })}
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
                                Tip:{' '}
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs font-medium underline hover:text-primary"
                                    onClick={() =>
                                        authClient.signIn.social({
                                            provider: 'google',
                                            callbackURL: window.location.href,
                                        })
                                    }
                                >
                                    Sign in with Google
                                </Button>{' '}
                                to save this receipt to your history.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </BrandedPageShell>
    )
}

interface IdentitySectionProps {
    user: UserType | undefined
    name: string
    setName: (name: string) => void
}

function IdentitySection({ user, name, setName }: IdentitySectionProps) {
    const router = useRouter()
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
                            displayName={user.name}
                        />
                        <div className="text-left">
                            <p className="font-semibold text-sm leading-none">
                                {name || 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Logged in</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            authClient.signOut()
                            router.invalidate()
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
    )
}
