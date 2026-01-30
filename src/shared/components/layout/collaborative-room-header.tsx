import { useState } from 'react';
import {
  Lock,
  MoreHorizontal,
  Pencil,
  Share2,
  Type,
  Unlock,
  Users,
} from 'lucide-react';
import { Link, useLocation } from '@tanstack/react-router';
import { QrShareSheet } from '../common/qr-code-shareable-sheet';
import { AppHeader } from './app-header';
import type { RoomDto, RoomMemberDto } from '@/shared/dto/types';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/shared/components/ui/scroll-area';
import { Button } from '@/shared/components/ui/button';
import { RoomMemberAvatar } from '@/features/room/components/room-member-avatar';
import { RenameRoomDialog } from '@/features/room/components/rename-room-dialog';
import { useLockRoom, useUnlockRoom } from '@/features/room/hooks/use-room';

interface CollaborativeRoomHeaderProps {
  roomId: string;
  receiptId: string;
  title: string;
  members: Array<RoomMemberDto>;
  activeFilterId: string | null;
  isHost: boolean;
  status: RoomDto['status'];
  onSelectFilter: (memberId: string | null) => void;
}

export function CollaborativeRoomHeader({
  roomId,
  receiptId,
  title,
  members,
  activeFilterId,
  isHost,
  status,
  onSelectFilter,
}: CollaborativeRoomHeaderProps) {
  const location = useLocation();
  const shareUrl = location.url;
  const [renameOpen, setRenameOpen] = useState(false);

  const { mutate: lock, isPending: isLocking } = useLockRoom(roomId);
  const { mutate: unlock, isPending: isUnlocking } = useUnlockRoom(roomId);
  const isLocked = status === 'locked';

  return (
    <AppHeader
      title={
        <div className="flex flex-col">
          <span className="truncate">{title}</span>
          <span className="text-xs font-normal text-muted-foreground truncate">
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </span>
        </div>
      }
      right={
        <>
          {isLocked ? (
            <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded-full px-3 py-3">
              <Lock className="h-4 w-4" />
              <span className="text-xs font-medium">Locked</span>
            </div>
          ) : (
            <QrShareSheet
              value={shareUrl}
              title="Invite Friends"
              description={
                <>
                  Scan to join <strong>{title}</strong>
                </>
              }
              trigger={
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-3 text-xs"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Invite
                </Button>
              }
            />
          )}

          {isHost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 rounded-full"
                >
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Room Options</DropdownMenuLabel>

                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Type className="mr-2 h-4 w-4" />
                  <span>Rename Room</span>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    to="/receipt/review/$receiptId"
                    params={{ receiptId: receiptId }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit Receipt</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => (isLocked ? unlock() : lock())}
                  disabled={isLocking || isUnlocking}
                >
                  {isLocked ? (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      <span>Unlock Room</span>
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      <span>Lock Room</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <RenameRoomDialog
            roomId={roomId}
            currentTitle={title}
            open={renameOpen}
            onOpenChange={setRenameOpen}
          />
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
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center border transition-all',
                  activeFilterId === null
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted',
                )}
              >
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
  );
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
  );
}
