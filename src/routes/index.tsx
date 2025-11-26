import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { data: session, isPending } = authClient.useSession()

  const signIn = () => {
    authClient.signIn.social({
      provider: 'google',
    })
  }
  const signOut = () => {
    authClient.signOut()
  }
  return (
    <div>
      {!isPending && !session ? (
        <Button onClick={signIn}>Login</Button>
      ) : (
        <Button onClick={signOut}>Logout</Button>
      )}
    </div>
  )
}
