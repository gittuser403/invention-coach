import { notFound } from 'next/navigation'
import { verifyUser } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { STAGES } from '@/lib/stages-config'
import { computeStageProgress } from '@/lib/stage-progress'
import { compilePitch } from '@/lib/pitch/compile'
import ChatPanel from '@/components/ChatPanel'
import ArtifactEditor from '@/components/ArtifactEditor'
import StageNav from '@/components/StageNav'
import PitchAssembly from '@/components/PitchAssembly'
import RevealOnMount from '@/components/motion/RevealOnMount'
import type { StageRow } from '@/lib/supabase/types'

// Config-driven — one page for all 7 stages (locked in during
// /plan-eng-review Code Quality Issue 5).
export default async function StagePage({
  params,
}: {
  params: Promise<{ number: string }>
}) {
  const user = await verifyUser()
  const { number } = await params
  const stageNumber = Number(number)
  const stage = STAGES.find((s) => s.number === stageNumber)

  if (!stage) {
    notFound()
  }

  const supabase = await createClient()

  const [{ data: messageRows }, { data: allStageRows }] = await Promise.all([
    supabase
      .from('messages')
      .select('role, content')
      .eq('user_id', user.id)
      .eq('stage_number', stageNumber)
      .order('created_at', { ascending: true }),
    supabase
      .from('stages')
      .select('id, user_id, stage_number, status, artifact, updated_at')
      .eq('user_id', user.id),
  ])

  const initialMessages = (messageRows ?? []).map((row) => ({
    role: row.role as 'user' | 'assistant',
    content: row.content,
  }))

  const { statusByStage } = computeStageProgress((allStageRows ?? []) as StageRow[])

  const currentStageRow = (allStageRows ?? []).find(
    (row) => row.stage_number === stageNumber
  ) as StageRow | undefined

  const initialArtifactText =
    (currentStageRow?.artifact as { text?: string } | undefined)?.text ?? ''
  const initialComplete = currentStageRow?.status === 'complete'

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <RevealOnMount>
        <StageNav activeStage={stage.number} statusByStage={statusByStage} />

        <h1 className="mt-4 text-xl font-semibold text-stone-900 sm:text-2xl">
          Stage {stage.number}: {stage.title}
        </h1>
        <p className="mt-2 text-sm text-stone-500">{stage.focus}</p>
      </RevealOnMount>

      <RevealOnMount delay={0.08}>
        <div className="mt-6">
          <ChatPanel stageNumber={stage.number} initialMessages={initialMessages} />
        </div>
      </RevealOnMount>

      {stage.number === 7 ? (
        // Stage 7 has no free-text artifact of its own — the system prompt
        // is explicit that "the system, not the AI narratively, compiles"
        // the one-pager from the already-confirmed stages 1-6.
        <RevealOnMount delay={0.16}>
          <div className="mt-6">
            <PitchAssembly pitch={compilePitch((allStageRows ?? []) as StageRow[])} />
          </div>
        </RevealOnMount>
      ) : (
        <RevealOnMount delay={0.16}>
          <div className="mt-6">
            <ArtifactEditor
              stageNumber={stage.number}
              artifactLabel={stage.artifactLabel}
              initialText={initialArtifactText}
              initialComplete={initialComplete}
            />
          </div>
        </RevealOnMount>
      )}
    </main>
  )
}
