import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client';
export const Route = createFileRoute('/login')({
    component: RouteComponent,
})

function RouteComponent() {
    const signIn = () => {

        authClient.signIn.social({
            provider: "google",
        });
    };
    return (<div>
        <Button onClick={signIn}>
            Login
        </Button>
    </div>)
}
