import { describe, it, expect } from 'vitest'
import { computeStageProgress, computeRevisitNotice } from '@/lib/stage-progress'
import { TOTAL_STAGES } from '@/lib/stages-config'
import type { StageRow } from '@/lib/supabase/types'

function makeRow(overrides: Partial<StageRow>): StageRow {
  return {
    id: 'row-id',
    user_id: 'user-id',
    stage_number: 1,
    status: 'not_started',
    artifact: {},
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('computeStageProgress', () => {
  it('treats no rows at all as Stage 1, 0 completed', () => {
    const { completedCount, currentStage } = computeStageProgress([])
    expect(completedCount).toBe(0)
    expect(currentStage).toBe(1)
  })

  it('advances currentStage to the first non-complete stage', () => {
    const rows = [
      makeRow({ stage_number: 1, status: 'complete' }),
      makeRow({ stage_number: 2, status: 'complete' }),
      makeRow({ stage_number: 3, status: 'in_progress' }),
    ]
    const { completedCount, currentStage } = computeStageProgress(rows)
    expect(completedCount).toBe(2)
    expect(currentStage).toBe(3)
  })

  it('does not require sequential completion — a gap still finds the first incomplete stage', () => {
    // Non-linear editing is a hard requirement: a student can complete
    // stage 4 without stage 2 being done yet.
    const rows = [
      makeRow({ stage_number: 1, status: 'complete' }),
      makeRow({ stage_number: 2, status: 'in_progress' }),
      makeRow({ stage_number: 4, status: 'complete' }),
    ]
    const { completedCount, currentStage } = computeStageProgress(rows)
    expect(completedCount).toBe(2)
    expect(currentStage).toBe(2)
  })

  it('caps currentStage at the last stage when all stages are complete', () => {
    const rows = Array.from({ length: TOTAL_STAGES }, (_, i) =>
      makeRow({ stage_number: i + 1, status: 'complete' })
    )
    const { completedCount, currentStage } = computeStageProgress(rows)
    expect(completedCount).toBe(TOTAL_STAGES)
    expect(currentStage).toBe(TOTAL_STAGES)
  })

  it('ignores duplicate rows for the same stage_number by taking the last one', () => {
    const rows = [
      makeRow({ stage_number: 1, status: 'complete' }),
      makeRow({ stage_number: 1, status: 'not_started' }),
    ]
    const { completedCount } = computeStageProgress(rows)
    expect(completedCount).toBe(0)
  })
})

describe('computeRevisitNotice', () => {
  it('returns null when no later stage has any progress', () => {
    expect(computeRevisitNotice(3, [1, 2])).toBeNull()
    expect(computeRevisitNotice(3, [])).toBeNull()
  })

  it('names the nearest later stage with progress, not just any later stage', () => {
    expect(computeRevisitNotice(2, [5, 3, 4])).toBe(
      'You edited Stage 2 — you may want to revisit Stage 3.'
    )
  })

  it('ignores earlier and equal-numbered stages', () => {
    expect(computeRevisitNotice(4, [1, 2, 3, 4])).toBeNull()
  })

  it('never cascades or invalidates — it only ever returns a message, callers must not act on later stages', () => {
    // This test documents the contract: the function is pure and read-only.
    // It has no side effect on later stages' data, matching the design
    // doc's "never cascades or invalidates" requirement.
    const result = computeRevisitNotice(1, [2])
    expect(typeof result).toBe('string')
  })
})
