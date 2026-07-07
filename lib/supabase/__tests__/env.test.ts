import { describe, it, expect, afterEach } from 'vitest'
import { getSupabaseEnv } from '@/lib/supabase/env'

// Regression: production Google sign-in failed with
// "AuthRetryableFetchError: Cannot convert argument to a ByteString" —
// NEXT_PUBLIC_SUPABASE_ANON_KEY had a trailing newline from being pasted
// into Vercel's env var UI (same root cause class as the earlier Upstash
// URL bug). A newline in an HTTP header value throws exactly this error.
const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('getSupabaseEnv', () => {
  it('trims a trailing newline from the anon key, matching the production failure', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://edeohozemuijamqeseqs.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'a-real-looking-key\n'

    const { anonKey } = getSupabaseEnv()

    expect(anonKey).toBe('a-real-looking-key')
    expect(anonKey).not.toMatch(/\s/)
  })

  it('trims surrounding whitespace from the URL too', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '  https://edeohozemuijamqeseqs.supabase.co  '
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'a-key'

    const { url } = getSupabaseEnv()

    expect(url).toBe('https://edeohozemuijamqeseqs.supabase.co')
  })

  it('throws a clear error instead of a cryptic downstream failure when unset', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => getSupabaseEnv()).toThrow(/Missing NEXT_PUBLIC_SUPABASE/)
  })
})
