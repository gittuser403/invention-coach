import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// getUser() (not getSession()) — verified against the Auth server, safe to
// use for authorization decisions. Cached per render pass so multiple
// callers in one request don't trigger duplicate network calls.
export const verifyUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
})
