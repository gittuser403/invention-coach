'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getOrigin() {
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  return `${proto}://${host}`
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = await getOrigin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/login?error=Could not authenticate with Google')
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// "Forget me" sign-out: wipes every row the student owns before ending the
// session. Deleting `stages` cascades to `shared_pitches` (FK on delete
// cascade in 0001_init.sql), so messages + stages covers everything.
export async function signOutAndForgetData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const [{ error: messagesError }, { error: stagesError }] = await Promise.all([
      supabase.from('messages').delete().eq('user_id', user.id),
      supabase.from('stages').delete().eq('user_id', user.id),
    ])
    // Don't sign out if the wipe failed — a student who clicked "forget my
    // data" should never be left believing data was erased when it wasn't.
    if (messagesError || stagesError) {
      redirect('/dashboard?error=Could not erase your data — please try again')
    }
  }

  await supabase.auth.signOut()
  redirect('/login?message=Your data has been erased')
}
