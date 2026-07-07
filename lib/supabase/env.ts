// Trims both values defensively before any Supabase client is constructed.
// A trailing newline from copy-pasting into Vercel's env var UI already
// broke two things in this project (Upstash's URL constructor, and now the
// Supabase anon key used as an HTTP header — a trailing newline there
// throws "AuthRetryableFetchError: Cannot convert argument to a ByteString"
// since header values can't contain control characters). Trimming once,
// here, in the one place every Supabase client reads from, closes this
// whole class of bug regardless of which env var gets pasted sloppily next.
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.'
    )
  }

  return { url, anonKey }
}
