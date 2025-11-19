import { authClient } from "@/lib/auth-client";

export async function getServerSession(req?: Request) {
    return authClient.getSession({
        fetchOptions: {
            headers: req?.headers,
        }
    });
}
