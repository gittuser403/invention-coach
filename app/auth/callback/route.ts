import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

// Handles both the Google OAuth redirect and the magic-link redirect —
// both land here with a `code` param to exchange for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // Temporary diagnostic logging — tracking down a persistent
    // "AuthRetryableFetchError: Cannot convert argument to a ByteString"
    // that survived trimming NEXT_PUBLIC_SUPABASE_ANON_KEY. Dumps
    // non-secret shape info (lengths, char codes, cookie names) to find
    // exactly which value is malformed, not the values themselves.
    try {
      const { url, anonKey } = getSupabaseEnv()
      const nonPrintable = [...anonKey]
        .map((ch, i) => ({ i, code: ch.codePointAt(0)! }))
        .filter((c) => c.code < 32 || c.code > 126)
      console.error('DIAGNOSTIC supabase env shape', {
        urlLength: url.length,
        anonKeyLength: anonKey.length,
        anonKeyPrefix: anonKey.slice(0, 12),
        anonKeySuffix: anonKey.slice(-6),
        anonKeyNonPrintableChars: nonPrintable,
      })

      const cookieHeader = request.headers.get('cookie') ?? ''
      const cookieNames = cookieHeader
        .split(';')
        .map((c) => c.trim().split('=')[0])
        .filter(Boolean)
      console.error('DIAGNOSTIC cookies present on callback request', cookieNames)
    } catch (diagErr) {
      console.error('DIAGNOSTIC logging itself failed', diagErr)
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('exchangeCodeForSession failed', {
      message: error.message,
      name: error.name,
      status: error.status,
      cause: (error as { cause?: unknown }).cause,
      stack: error.stack,
    })
  } else {
    console.error('/auth/callback hit with no code param', request.url)
  }

  return NextResponse.redirect(`${origin}/login?error=Sign-in failed, please try again`)
}
