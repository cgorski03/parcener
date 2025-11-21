import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { RoomMemberSelect } from "@/server/db";
import { Users } from "lucide-react";

type RoomMembersBarProps =
    {
        members: RoomMemberSelect[];
        activeMemberId: string;
        onSelectMember: (memberId: string) => void;
    }

export function RoomMembersBar({ members, activeMemberId, onSelectMember }: RoomMembersBarProps) {
    return (
        <div className="border-b bg-background/95 backdrop-blur py-3">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 px-4">
                    <div className="flex flex-col items-center gap-1">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">All</span>
                    </div>
                    {members.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => onSelectMember(m.id)}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <Avatar className={`h-10 w-10 border-2 transition-all ${activeMemberId === m.id ? "border-primary ring-2 ring-primary/20" : "border-transparent grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"
                                }`}>
                                <AvatarFallback>{m.displayName ? m.displayName[0] : "G"}</AvatarFallback>
                            </Avatar>
                            <span className={`text-[10px] font-medium max-w-[60px] truncate ${activeMemberId === m.id ? "text-primary" : "text-muted-foreground"
                                }`}>
                                {m.displayName}
                            </span>
                        </button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
        </div>
    );
}
