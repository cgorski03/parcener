import type { ApplicationAuthClient } from '.';

export async function getServerSession(
  req: Request,
  auth: ApplicationAuthClient,
) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // Guard against better-auth returning a Response object in edge cases
  // This happens in race conditions or when session state is invalid
  if (session && typeof session === 'object' && 'user' in session) {
    return session;
  }

  return null;
}
