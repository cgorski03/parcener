import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000"
})


export async function getServerSession(req?: Request) {
    return authClient.getSession({
        fetchOptions: {
            headers: req?.headers,
        }
    });
}
