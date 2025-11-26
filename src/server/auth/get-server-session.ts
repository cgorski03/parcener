import { Auth } from 'better-auth'

export async function getServerSession(req: Request, auth: Auth) {
  const session = await auth.api.getSession({
    headers: req.headers,
  })
  return session
}
