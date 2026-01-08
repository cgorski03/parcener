import { AppUser } from '@/shared/server/db';
import { ActiveRoomScreen } from '../components/active-room-screen';
import { LobbyScreen } from '../components/lobby-screen';
import type { FullRoomInfoDto, RoomMembership } from '@/shared/dto/types';

type RoomPageProps = {
  room: FullRoomInfoDto;
  membership: RoomMembership | null;
  user: AppUser | undefined;
};

export function RoomPage({ room, membership, user }: RoomPageProps) {
  if (membership) {
    return <ActiveRoomScreen initialRoom={room} member={membership} />;
  }

  return <LobbyScreen room={room} user={user ?? undefined} />;
}
