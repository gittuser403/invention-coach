import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles both the Google OAuth redirect and the magic-link redirect —
// both land here with a `code` param to exchange for a session.
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
    console.error('exchangeCodeForSession failed', error)
  } else {
    console.error('/auth/callback hit with no code param', request.url)
  }

  return NextResponse.redirect(`${origin}/login?error=Sign-in failed, please try again`)
}
