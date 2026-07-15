import Link from 'next/link'
import { verifyUser } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { STAGES, TOTAL_STAGES } from '@/lib/stages-config'
import { computeStageProgress } from '@/lib/stage-progress'
import JourneyPath from '@/components/motion/JourneyPath'
import RevealOnMount from '@/components/motion/RevealOnMount'
import type { StageRow } from '@/lib/supabase/types'

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  not_started: 'bg-stone-100 text-stone-500',
  in_progress: 'bg-celebrate-400/20 text-celebrate-600',
  complete: 'bg-brand-100 text-brand-700',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const user = await verifyUser()
  const supabase = await createClient()

  // Dashboard query scope locked in /plan-eng-review Performance Issue 7:
  // only ever reads `stages`, never joins `messages`, so this stays fast
  // no matter how long a student's chat history gets.
  const { data: stageRows } = await supabase
    .from('stages')
    .select('id, user_id, stage_number, status, artifact, updated_at')
    .eq('user_id', user.id)
    .order('stage_number', { ascending: true })

  const { statusByStage, completedCount, currentStage } = computeStageProgress(
    (stageRows ?? []) as StageRow[]
  )

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <RevealOnMount>
        <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">
          Stage {currentStage} of {TOTAL_STAGES}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {completedCount} of {TOTAL_STAGES} stages complete.
        </p>
      </RevealOnMount>

      <RevealOnMount delay={0.08}>
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <JourneyPath statusByStage={statusByStage} />
        </div>
      </RevealOnMount>

      <ol className="mt-6 flex flex-col gap-2 sm:mt-8">
        {STAGES.map((stage, index) => {
          const status = statusByStage.get(stage.number) ?? 'not_started'
          return (
            <RevealOnMount key={stage.number} delay={0.12 + index * 0.04}>
              <li>
                <Link
                  href={`/stage/${stage.number}`}
                  className="group flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-stone-800">
                      {stage.number}. {stage.title}
                    </span>
                    <span className="block truncate text-xs text-stone-500">
                      {stage.artifactLabel}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-transform group-hover:scale-105 ${STATUS_BADGE_CLASS[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </Link>
              </li>
            </RevealOnMount>
          )
        })}
      </ol>
    </main>
  )
}
