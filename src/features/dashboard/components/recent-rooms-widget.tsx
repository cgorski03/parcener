import { ChevronRight, Lock, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useRecentRooms } from '../hooks/use-recents';
import { RecentList } from './recent-list-widget';
import type { RecentRoomInfoDto } from '@/shared/dto/types';

export function RecentRooms() {
  const { data, isLoading } = useRecentRooms();

  return (
    <RecentList
      title="Recent Rooms"
      data={data}
      isLoading={isLoading}
      emptyState={{
        icon: (
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        ),
        title: 'No rooms yet',
        description: 'Join or create a room to start splitting bills',
      }}
      renderItem={({ joinedAt, room }: RecentRoomInfoDto) => (
        <Link
          key={room.roomId}
          to="/receipt/parce/$roomId"
          preload="viewport"
          search={{ view: 'items' }}
          params={{ roomId: room.roomId }}
          className="group flex items-center p-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
            <Users className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
          </div>

          <div className="ml-3 flex min-w-0 flex-1 items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-medium text-foreground">
                  {room.title || 'Untitled Room'}
                </h4>
                {room.status === 'locked' && (
                  <Lock className="h-3 w-3 text-amber-500/80" />
                )}
              </div>
              <div className="mt-0.5 flex items-center text-[10px] text-muted-foreground">
                <span>Joined {new Date(joinedAt).toLocaleDateString()}</span>
                {room.status === 'locked' && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="text-amber-600/80">Locked</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
        </Link>
      )}
    />
  );
}
