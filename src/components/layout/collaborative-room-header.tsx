import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Share2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import QRCode from 'react-qr-code';
import { RoomMemberDto } from "@/server/dtos";
import { RoomMemberAvatar } from "../room/room-member-avatar";

interface CollaborativeRoomHeaderProps {
    roomName: string;
    roomId: string;
    members: RoomMemberDto[];
    activeFilterId: string | null;
    onSelectFilter: (memberId: string | null) => void;
}

export function CollaborativeRoomHeader({
    roomName,
    roomId,
    members,
    activeFilterId,
    onSelectFilter
}: CollaborativeRoomHeaderProps) {
    const [isShareOpen, setIsShareOpen] = useState(false);
    // TODO 
    const shareUrl = `http://192.168.86.235:3000/parce/${roomId}`

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join bill split: ${roomName}`,
                    url: shareUrl,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(shareUrl);
            // Show toast here
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b supports-[backdrop-filter]:bg-background/60">
            {/* Row 1: Navigation & Actions */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" asChild>
                        <Link to="/receipts"> {/* Or wherever back goes */}
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="min-w-0">
                        <h1 className="font-bold text-lg leading-tight truncate max-w-[200px]">
                            {roomName}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {`${members.length} ${members.length === 1 ? 'person' : 'people'} active `}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Share Sheet / Button */}
                    <Sheet open={isShareOpen} onOpenChange={setIsShareOpen}>
                        <SheetTrigger asChild>
                            <Button variant="secondary" size="sm" className="rounded-full h-9 px-4">
                                <Share2 className="h-4 w-4 mr-2" />
                                Invite
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-xl">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Invite Friends</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col items-center justify-center space-y-6 pb-8">
                                <div className="bg-white p-4 rounded-xl shadow-sm border">
                                    <QRCode value={shareUrl} size={128} />
                                </div>
                                <p className="text-sm text-muted-foreground text-center max-w-xs">
                                    Scan to join <strong>{roomName}</strong><br />
                                    or click below to share the link.
                                </p>
                                <Button className="w-full max-w-sm" size="lg" onClick={handleNativeShare}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share Link
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Row 2: Members Filter Bar */}
            <div className="pb-3">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-3 px-4 items-center">

                        {/* "All Items" Filter */}
                        <FilterPill
                            label="All Items"
                            isActive={activeFilterId === null}
                            onClick={() => onSelectFilter(null)}
                        >
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors",
                                activeFilterId === null
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-muted border-transparent text-muted-foreground"
                            )}>
                                <Users className="h-4 w-4" />
                            </div>
                        </FilterPill>

                        <div className="h-8 w-px bg-border mx-1" />

                        {/* Individual Members */}
                        {members.map((m) => (
                            <FilterPill
                                key={m.id}
                                label={m.displayName}
                                isActive={activeFilterId === m.id}
                                onClick={() => onSelectFilter(m.id)}
                            >
                                <RoomMemberAvatar
                                    id={m.id}
                                    avatarUrl={m.avatarUrl}
                                    size="sm"
                                    displayName={m.displayName} />
                            </FilterPill>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
            </div>
        </header>
    );
}

function FilterPill({ children, label, isActive, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center gap-1.5 transition-all focus:outline-none"
        >
            {children}
            <span className={cn(
                "text-[10px] font-medium transition-colors max-w-[60px] truncate",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}>
                {label}
            </span>
        </button>
    )
}
