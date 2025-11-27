import { ApplicationAuthClient } from "."

export async function getServerSession(req: Request, auth: ApplicationAuthClient) {
    const session = await auth.api.getSession({
        headers: req.headers,
    })
    return session
}
