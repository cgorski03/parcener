import type {
  FullRoomInfoDto,
  RoomMemberDto,
  RoomMembership,
} from '@/shared/dto/types';

function getCurrentRoomMember(
  room: FullRoomInfoDto,
  member: RoomMembership,
): RoomMemberDto {
  // RoomMembership is the current viewer's private room identity. RoomMemberDto
  // is the public roster shape with display/avatar fields used by the UI. Keep
  // the conversion in one place so active room children do not carry
  // RoomMemberDto | undefined through their props.
  const currentMember = room.members.find(
    (roomMember) => roomMember.roomMemberId === member.roomMemberId,
  );

  if (!currentMember) {
    // This state is impossible and should be unrepresentable
    throw new Error('Current room member missing from room member list');
  }

  return currentMember;
}

export function useCurrentRoomContext(
  room: FullRoomInfoDto,
  member: RoomMembership,
) {
  return {
    currentMember: getCurrentRoomMember(room, member),
    isHost: room.createdBy === member.userId,
  };
}
