import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { compilePitch } from '@/lib/pitch/compile'
import PitchPdfDocument from '@/lib/pitch/PitchPdfDocument'
import type { StageRow } from '@/lib/supabase/types'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  let stageRows: StageRow[] = []
  let studentName: string | null = null

  if (slug) {
    // Public path — no auth required, but only for an explicitly enabled
    // share (RLS also enforces this independently at the DB layer).
    const { data: shared } = await supabase
      .from('shared_pitches')
      .select('stage_row_id, show_name, enabled, student_name')
      .eq('share_slug', slug)
      .maybeSingle()

    if (!shared || !shared.enabled) {
      return Response.json({ error: 'This pitch is not available' }, { status: 404 })
    }

    const { data: ownerRow } = await supabase
      .from('stages')
      .select('user_id')
      .eq('id', shared.stage_row_id)
      .maybeSingle()

    if (!ownerRow) {
      return Response.json({ error: 'This pitch is not available' }, { status: 404 })
    }

    const { data: rows } = await supabase
      .from('stages')
      .select('id, user_id, stage_number, status, artifact, updated_at')
      .eq('user_id', ownerRow.user_id)

    stageRows = (rows ?? []) as StageRow[]
    studentName = shared.show_name ? (shared.student_name as string | null) : null
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: rows } = await supabase
      .from('stages')
      .select('id, user_id, stage_number, status, artifact, updated_at')
      .eq('user_id', user.id)

    stageRows = (rows ?? []) as StageRow[]
    studentName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null
  }

  const pitch = compilePitch(stageRows)
  // PitchPdfDocument is a wrapper that renders a <Document> internally —
  // the standard react-pdf pattern (see their own README), but renderToBuffer's
  // type signature narrowly expects a literal Document element, so this
  // assertion reflects a real, documented usage gap in their .d.ts, not a
  // type-safety hole in our code.
  const buffer = await renderToBuffer(
    createElement(PitchPdfDocument, { pitch, studentName }) as ReactElement<DocumentProps>
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(pitch.nameAndTagline || 'invention-pitch').replace(/[^a-z0-9-]+/gi, '-')}.pdf"`,
    },
  })
}
