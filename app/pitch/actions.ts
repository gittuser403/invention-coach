'use server'

import { createClient } from '@/lib/supabase/server'

async function getOwnStage7RowId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from('stages')
    .select('id')
    .eq('user_id', userId)
    .eq('stage_number', 7)
    .maybeSingle()
  return data?.id as string | undefined
}

function ownDisplayName(user: { user_metadata?: Record<string, unknown> }) {
  return (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null
  )
}

// Creates the share row on first use; afterward just returns the existing
// slug so the URL never changes underneath a student who already shared it.
// student_name is denormalized here (from the owner's OWN metadata, which
// they can read) since the public share page has no admin API access to
// look up another user's auth metadata later.
export async function getOrCreateShareLink() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', slug: null, enabled: false, showName: false }

  let stageRowId = await getOwnStage7RowId(supabase, user.id)
  if (!stageRowId) {
    // Stage 7 row may not exist yet if the student hasn't touched it —
    // create an empty one so the share link has something to point at.
    const { data: created, error: createError } = await supabase
      .from('stages')
      .insert({ user_id: user.id, stage_number: 7, status: 'not_started', artifact: {} })
      .select('id')
      .single()
    if (createError || !created) {
      return { error: 'Could not prepare pitch', slug: null, enabled: false, showName: false }
    }
    stageRowId = created.id
  }

  const { data: existing } = await supabase
    .from('shared_pitches')
    .select('share_slug, enabled, show_name')
    .eq('stage_row_id', stageRowId)
    .maybeSingle()

  if (existing) {
    return {
      error: null,
      slug: existing.share_slug as string,
      enabled: existing.enabled as boolean,
      showName: existing.show_name as boolean,
    }
  }

  const { data: created, error } = await supabase
    .from('shared_pitches')
    .insert({ stage_row_id: stageRowId, student_name: ownDisplayName(user) })
    .select('share_slug, enabled, show_name')
    .single()

  if (error || !created) {
    return { error: 'Could not create share link', slug: null, enabled: false, showName: false }
  }

  return {
    error: null,
    slug: created.share_slug as string,
    enabled: created.enabled as boolean,
    showName: created.show_name as boolean,
  }
}

export async function setShareSettings(input: { enabled?: boolean; showName?: boolean }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const stageRowId = await getOwnStage7RowId(supabase, user.id)
  if (!stageRowId) return { error: 'No pitch to update yet' }

  const { error } = await supabase
    .from('shared_pitches')
    .update({
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.showName !== undefined ? { show_name: input.showName } : {}),
      // Refresh the denormalized name whenever settings change, in case the
      // student's Google profile name changed since the link was created.
      student_name: ownDisplayName(user),
    })
    .eq('stage_row_id', stageRowId)

  return { error: error ? 'Could not update sharing settings' : null }
}
