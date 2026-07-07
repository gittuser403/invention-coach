import Link from 'next/link'
import { STAGES } from '@/lib/stages-config'
import type { StageStatus } from '@/lib/supabase/types'

const STATUS_TEXT: Record<StageStatus, string> = {
  not_started: 'not started',
  in_progress: 'in progress',
  complete: 'complete',
}

// Non-linear editing means jumping to any stage at any time, not just the
// "current" one the dashboard points to — this is the on-page equivalent
// of the dashboard's stage list, for quick lateral movement without a
// round-trip back to /dashboard.
export default function StageNav({
  activeStage,
  statusByStage,
}: {
  activeStage: number
  statusByStage: Map<number, StageStatus>
}) {
  return (
    <nav aria-label="Jump to stage" className="flex flex-wrap gap-2">
      {STAGES.map((stage) => {
        const status = statusByStage.get(stage.number) ?? 'not_started'
        const isActive = stage.number === activeStage
        return (
          <Link
            key={stage.number}
            href={`/stage/${stage.number}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Stage ${stage.number}: ${stage.title} (${STATUS_TEXT[status]})`}
            title={stage.title}
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
              isActive
                ? 'border-brand-700 bg-brand-700 text-white'
                : status === 'complete'
                  ? 'border-brand-300 bg-brand-50 text-brand-700 hover:border-brand-400'
                  : status === 'in_progress'
                    ? 'border-celebrate-400 bg-celebrate-400/10 text-celebrate-600 hover:border-celebrate-500'
                    : 'border-stone-200 text-stone-400 hover:border-stone-300'
            }`}
          >
            {stage.number}
          </Link>
        )
      })}
    </nav>
  )
}
