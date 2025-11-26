import { updateRoomDisplayNameRpc } from '@/server/room/room-rpc'
import { useMutation } from '@tanstack/react-query'

type UpdateDisplayNameRequest = {
  roomId: string
  newDisplayName: string
}

export function useEditDisplayName() {
  return useMutation({
    mutationFn: async (request: UpdateDisplayNameRequest) => {
      const { roomId, newDisplayName } = request
      await updateRoomDisplayNameRpc({ data: { roomId, name: newDisplayName } })
    },
    onError: (error) => {
      console.error('Failed to create receipt room', error)
    },
  })
}
