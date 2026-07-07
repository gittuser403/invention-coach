import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { compilePitch } from '@/lib/pitch/compile'
import PitchOnePager from '@/components/PitchOnePager'
import type { StageRow } from '@/lib/supabase/types'

// No-auth, view-only — this is the actual "deliverable" a student hands to
// a judge or teacher. Deliberately read-only: nothing here can be edited,
// keeping the stages tables as the single source of truth.
export default async function PublicPitchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: shared } = await supabase
    .from('shared_pitches')
    .select('stage_row_id, show_name, enabled, student_name')
    .eq('share_slug', slug)
    .maybeSingle()

  if (!shared || !shared.enabled) {
    notFound()
  }

  const { data: ownerRow } = await supabase
    .from('stages')
    .select('user_id')
    .eq('id', shared.stage_row_id)
    .maybeSingle()

  if (!ownerRow) {
    notFound()
  }

  const { data: rows } = await supabase
    .from('stages')
    .select('id, user_id, stage_number, status, artifact, updated_at')
    .eq('user_id', ownerRow.user_id)

  const pitch = compilePitch((rows ?? []) as StageRow[])
  const studentName = shared.show_name ? shared.student_name : null

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <PitchOnePager pitch={pitch} studentName={studentName} />
      <a
        href={`/api/pitch/pdf?slug=${slug}`}
        className="mt-4 inline-flex min-h-[44px] items-center rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Download PDF
      </a>
    </main>
  )
}
