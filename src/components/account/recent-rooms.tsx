import { useRecentRooms } from '@/hooks/useRoom';
import { RecentRoomInfoDto } from '@/server/dtos';
import { Users, Plus, ChevronRight } from 'lucide-react';
import { RecentList } from './recent-list';
import { Link } from '@tanstack/react-router';

export function RecentRooms() {
    const { data, isLoading } = useRecentRooms();

    return (
        <RecentList
            title="Recent Rooms"
            data={data}
            isLoading={isLoading}
            emptyState={{
                icon: <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />,
                title: "No rooms yet",
                description: "Create a room to start splitting bills",
                cta: "Create Your First Room",
                ctaLink: "/rooms/create",
            }}
            addButton={{
                link: "/rooms/create",
                text: "Create Room",
                icon: <Plus className="h-4 w-4 mr-1.5" />,
            }}
            renderItem={({ joinedAt, room }: RecentRoomInfoDto) => (
                <Link
                    key={room.roomId}
                    to={`/receipt/parce/${room.roomId}`}
                    className="flex items-center p-3 hover:bg-muted/50 transition-colors group"
                >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 border">
                        <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>

                    <div className="ml-3 flex-1 min-w-0 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h4 className="text-sm font-medium truncate text-foreground">
                                {room.title || 'Untitled Room'}
                            </h4>
                            <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                                <span>Joined {new Date(joinedAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-2 shrink-0 group-hover:text-muted-foreground transition-colors" />
                </Link>
            )}
        />
    );
}
