import { describe, it, expect } from 'vitest'
import { compilePitch, isPitchReady } from '@/lib/pitch/compile'
import type { StageRow } from '@/lib/supabase/types'

function makeRow(stageNumber: number, text: string, status: StageRow['status']): StageRow {
  return {
    id: `row-${stageNumber}`,
    user_id: 'user-id',
    stage_number: stageNumber,
    status,
    artifact: { text },
    updated_at: new Date().toISOString(),
  }
}

describe('compilePitch', () => {
  it('assembles each field from its own stage, verbatim, never rewriting', () => {
    const rows = [
      makeRow(1, 'Students lose focus during long lectures.', 'complete'),
      makeRow(2, 'Existing apps are generic timers, not lecture-aware.', 'complete'),
      makeRow(3, 'Idea A, Idea B, Idea C', 'complete'),
      makeRow(4, 'Idea B — cheapest to build, most students affected.', 'complete'),
      makeRow(5, 'A wearable buzzes every 10 minutes of low engagement.', 'complete'),
      makeRow(6, 'FocusBuddy — "Never zone out again."', 'complete'),
    ]
    const pitch = compilePitch(rows)
    expect(pitch.problemStatement).toBe('Students lose focus during long lectures.')
    expect(pitch.existingSolutions).toBe(
      'Existing apps are generic timers, not lecture-aware.'
    )
    expect(pitch.selectedConcept).toBe(
      'Idea B — cheapest to build, most students affected.'
    )
    expect(pitch.howItWorks).toBe(
      'A wearable buzzes every 10 minutes of low engagement.'
    )
    expect(pitch.nameAndTagline).toBe('FocusBuddy — "Never zone out again."')
  })

  it('returns empty strings for missing stages rather than throwing', () => {
    const pitch = compilePitch([])
    expect(pitch.problemStatement).toBe('')
    expect(pitch.nameAndTagline).toBe('')
  })

  it('marks a stage ready only when explicitly complete, not just non-empty text', () => {
    const rows = [makeRow(1, 'A problem statement', 'in_progress')]
    const pitch = compilePitch(rows)
    expect(pitch.readiness.find((r) => r.stageNumber === 1)?.ready).toBe(false)
  })

  it('never reads Stage 7 as a source for its own compilation', () => {
    const rows = [makeRow(7, 'Should never appear', 'complete')]
    const pitch = compilePitch(rows)
    expect(pitch.problemStatement).not.toContain('Should never appear')
    expect(pitch.nameAndTagline).not.toContain('Should never appear')
  })
})

describe('isPitchReady', () => {
  it('is false until all of stages 1-6 are complete', () => {
    const rows = [1, 2, 3, 4, 5].map((n) => makeRow(n, 'text', 'complete'))
    expect(isPitchReady(compilePitch(rows))).toBe(false)
  })

  it('is true once all six are complete', () => {
    const rows = [1, 2, 3, 4, 5, 6].map((n) => makeRow(n, 'text', 'complete'))
    expect(isPitchReady(compilePitch(rows))).toBe(true)
  })
})
