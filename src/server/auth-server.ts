import { authClient } from '@/lib/auth-client';

export async function getSession(req?: Request) {
    return authClient.getSession({
        fetchOptions: {
            headers: req?.headers,
        }
    });
}
