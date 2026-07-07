'use server'

import { createClient } from '@/lib/supabase/server'
import { computeRevisitNotice } from '@/lib/stage-progress'

// The artifact is always the student's own typed words — there is no
// "generate for me" path anywhere in this app (hard product rule). This
// action only ever persists what the student themselves entered.
export async function saveArtifact(stageNumber: number, text: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', revisitNotice: null }
  }

  const { data: existing } = await supabase
    .from('stages')
    .select('status')
    .eq('user_id', user.id)
    .eq('stage_number', stageNumber)
    .maybeSingle()

  // Autosave only ever advances not_started -> in_progress. It never
  // downgrades a 'complete' stage back to in_progress just because the
  // student fixed a typo — completion is a deliberate, separate action
  // (see setStageStatus below), not an autosave side effect.
  const status =
    existing?.status === 'complete'
      ? 'complete'
      : text.trim().length > 0
        ? 'in_progress'
        : 'not_started'

  const { error } = await supabase.from('stages').upsert(
    {
      user_id: user.id,
      stage_number: stageNumber,
      artifact: { text },
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,stage_number' }
  )

  if (error) {
    console.error('saveArtifact upsert failed', error)
    return { error: 'Could not save', revisitNotice: null }
  }

  const { data: laterRows } = await supabase
    .from('stages')
    .select('stage_number')
    .eq('user_id', user.id)
    .neq('status', 'not_started')

  const revisitNotice = computeRevisitNotice(
    stageNumber,
    (laterRows ?? []).map((r) => r.stage_number)
  )

  return { error: null, revisitNotice }
}

// Marking a stage complete is a deliberate student action, distinct from
// the artifact's autosave — it's what the Stage 7 system prompt means by
// "ask the student to confirm... before compiling."
//
// Takes the CURRENT in-memory text from the client rather than re-reading
// the DB, and saves it in the same upsert. Reading from the DB here was a
// real bug: the artifact autosaves on a 2s debounce, so a student who
// typed something and immediately checked the box would hit "write
// something first" even though they clearly had — the DB just hadn't
// caught up yet. Passing the live text closes that race entirely and
// guarantees nothing typed is lost at the moment of marking complete.
export async function setStageComplete(
  stageNumber: number,
  complete: boolean,
  currentText: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (complete && !currentText.trim()) {
    return { error: 'Write something in your own words before marking this stage complete.' }
  }

  const { error } = await supabase.from('stages').upsert(
    {
      user_id: user.id,
      stage_number: stageNumber,
      artifact: { text: currentText },
      status: complete ? 'complete' : 'in_progress',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,stage_number' }
  )

  if (error) {
    console.error('setStageComplete upsert failed', error)
  }

  return { error: error ? 'Could not update' : null }
}
