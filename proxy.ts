import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 renamed Middleware to Proxy — same file-convention slot,
// same runtime behavior, new name. See node_modules/next/dist/docs/
// 01-app/01-getting-started/16-proxy.md.
export function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
