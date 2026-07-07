import { STAGES, TOTAL_STAGES } from '@/lib/stages-config'
import type { StageRow, StageStatus } from '@/lib/supabase/types'

export function computeStageProgress(stageRows: StageRow[]) {
  const statusByStage = new Map<number, StageStatus>(
    stageRows.map((row) => [row.stage_number, row.status])
  )

  const completedCount = STAGES.filter(
    (s) => statusByStage.get(s.number) === 'complete'
  ).length

  const currentStage =
    STAGES.find((s) => statusByStage.get(s.number) !== 'complete')?.number ??
    TOTAL_STAGES

  return { statusByStage, completedCount, currentStage }
}

// Non-linear editing behavior locked in during /plan-eng-review: editing an
// earlier stage never cascades or invalidates later stages automatically —
// it only surfaces a non-blocking notice naming the nearest later stage
// that already has some progress, so the student can decide whether to
// revisit it themselves.
export function computeRevisitNotice(
  currentStage: number,
  stageNumbersWithProgress: number[]
): string | null {
  const laterTouched = stageNumbersWithProgress
    .filter((n) => n > currentStage)
    .sort((a, b) => a - b)

  if (laterTouched.length === 0) return null

  return `You edited Stage ${currentStage} — you may want to revisit Stage ${laterTouched[0]}.`
}
