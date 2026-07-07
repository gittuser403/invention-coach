import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles the Google OAuth redirect — lands here with a `code` param to
// exchange for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('exchangeCodeForSession failed', error.message)
  } else {
    console.error('/auth/callback hit with no code param — likely an expired or already-used link')
  }

  return NextResponse.redirect(`${origin}/login?error=Sign-in failed, please try again`)
}
