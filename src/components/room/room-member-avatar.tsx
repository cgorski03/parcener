import { AvatarFallback, Avatar, AvatarImage } from '../ui/avatar'

export type RoomMemberAvatarProps = {
  id: string
  avatarUrl: string | null
  displayName: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function RoomMemberAvatar(props: RoomMemberAvatarProps) {
  const { id, avatarUrl, displayName, size = 'md' } = props

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <Avatar
      key={id}
      className={`${sizeClasses[size]} border-2 border-background ring-1 ring-muted shadow-sm`}
    >
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt={displayName ?? 'Guest'} />
      )}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {displayName?.substring(0, 2).toUpperCase() ?? 'G'}
      </AvatarFallback>
    </Avatar>
  )
}
