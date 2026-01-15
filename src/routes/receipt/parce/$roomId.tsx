import { createFileRoute, notFound } from '@tanstack/react-router';
import { RoomLoading } from '@/features/room/components/loading-view';
import { RoomPage } from '@/features/room/routes/room';
import {
  getRoomAndMembership,
  upgradeGuestToUser,
} from '@/features/room/server/room-rpc';
import { RoomNotFound } from '@/shared/components/layout/not-found';

type RoomSearch = {
  view: 'items' | 'settlement';
};

export const Route = createFileRoute('/receipt/parce/$roomId')({
  loader: async ({ params }) => {
    const response = await getRoomAndMembership({
      data: { roomId: params.roomId },
    });
    if (!response) {
      throw notFound();
    }
    const { room, membership, user, canMergeGuestToMember } = response;
    if (canMergeGuestToMember) {
      const newMembership = await upgradeGuestToUser({
        data: { roomId: params.roomId },
      });
      return { membership: newMembership, room, user };
    }
    return { room, membership, user };
  },
  head: ({ params }) => ({
    meta: [
      { title: 'Room | Parcener' },
      { property: 'og:title', content: `Join Room | Parcener` },
      {
        property: 'og:description',
        content:
          'Join room to share on expenses with your friends in real-time',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: `https://parcener.app/receipt/parce/${params.roomId}`,
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): RoomSearch => ({
    view: search.view === 'settlement' ? 'settlement' : 'items',
  }),
  component: RouteComponent,
  pendingComponent: RoomLoading,
  notFoundComponent: RoomNotFound,
});

function RouteComponent() {
  const { room, membership, user } = Route.useLoaderData();

  return <RoomPage room={room} membership={membership} user={user} />;
}
