// Pure routing decision, extracted from middleware.ts so it's unit-testable
// without mocking Supabase's network calls. API routes must never be
// redirected — they handle their own auth and return JSON.
export function shouldRedirectToLogin(path: string, hasUser: boolean): boolean {
  if (hasUser) return false

  const isPublicRoute =
    path === '/login' || path.startsWith('/auth') || path.startsWith('/pitch/')
  const isApiRoute = path.startsWith('/api/')

  return !isPublicRoute && !isApiRoute && path !== '/'
}
