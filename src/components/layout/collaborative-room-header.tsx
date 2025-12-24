import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
    Share2,
    Users,
    MoreHorizontal,
    Pencil,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Link, useLocation } from '@tanstack/react-router'
import type { RoomMemberDto } from '@/server/dtos'
import { RoomMemberAvatar } from '../room/room-member-avatar'
import { QrShareSheet } from '../common/qr-code-shareable-sheet'
import { AppHeader } from './app-header'

interface CollaborativeRoomHeaderProps {
    receiptId: string;
    title: string;
    members: RoomMemberDto[];
    activeFilterId: string | null;
    isHost: boolean;
    onSelectFilter: (memberId: string | null) => void;
}

export function CollaborativeRoomHeader({
    receiptId,
    title,
    members,
    activeFilterId,
    isHost,
    onSelectFilter,
}: CollaborativeRoomHeaderProps) {
    // TODO ENV VAR 
    const location = useLocation();
    const shareUrl = location.url;

    return (
        <AppHeader
            title={
                <div className="flex flex-col">
                    <span className="truncate">{title}</span>
                    <span className="text-xs font-normal text-muted-foreground truncate">
                        {members.length} {members.length === 1 ? 'person' : 'people'} active
                    </span>
                </div>
            }

            // Right Slot: Actions (Invite + Dropdown)
            right={
                <>
                    <QrShareSheet
                        value={shareUrl}
                        title="Invite Friends"
                        description={<>Scan to join <strong>{title}</strong></>}
                        trigger={
                            <Button variant="secondary" size="sm" className="rounded-full px-3 text-xs">
                                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                                Invite
                            </Button>
                        }
                    />

                    {isHost && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 rounded-full">
                                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Room Options</DropdownMenuLabel>

                                <>
                                    <DropdownMenuItem asChild>
                                        <Link to='/receipt/review/$receiptId'
                                            params={{ receiptId: receiptId }}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            <span>Edit Receipt</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </>
            }

            // Bottom Slot: Filter Pills
            bottom={
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-3 px-4 items-center">
                        <FilterPill
                            label="Everyone"
                            isActive={activeFilterId === null}
                            onClick={() => onSelectFilter(null)}
                        >
                            <div className={cn(
                                'h-8 w-8 rounded-full flex items-center justify-center border transition-all',
                                activeFilterId === null
                                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted',
                            )}>
                                <Users className="h-4 w-4" />
                            </div>
                        </FilterPill>

                        <div className="h-6 w-px bg-border/50 mx-1" />

                        {members.map((m) => (
                            <FilterPill
                                key={m.roomMemberId}
                                label={m.displayName}
                                isActive={activeFilterId === m.roomMemberId}
                                onClick={() => onSelectFilter(m.roomMemberId)}
                            >
                                <RoomMemberAvatar
                                    id={m.roomMemberId}
                                    avatarUrl={m.avatarUrl}
                                    size="sm"
                                    displayName={m.displayName}
                                />
                            </FilterPill>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
            }
        />
    )
}

function FilterPill({ children, label, isActive, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center gap-1.5 transition-all focus:outline-none select-none"
        >
            {children}
            <span
                className={cn(
                    'text-[10px] font-medium transition-colors max-w-[64px] truncate leading-tight',
                    isActive
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground/80 group-hover:text-foreground',
                )}
            >
                {label}
            </span>
        </button>
    )
}
