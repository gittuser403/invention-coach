import type { StageRow } from '@/lib/supabase/types'

export type CompiledPitch = {
  problemStatement: string
  existingSolutions: string
  selectedConcept: string
  howItWorks: string
  nameAndTagline: string
  // Stages 1-6, in order — true only once each is explicitly marked
  // complete (see /plan-tune... erm /plan-eng-review Phase 3 decision:
  // completion is a deliberate student action, not inferred from having
  // any text).
  readiness: { stageNumber: number; ready: boolean }[]
}

function artifactText(row: StageRow | undefined): string {
  return (row?.artifact as { text?: string } | undefined)?.text?.trim() ?? ''
}

// Pure, literal assembly of the student's own words from stages 1-6 — no
// AI rewriting, no synthesis. This is what the system prompt means by "the
// system (not the AI narratively) compiles the final one-pager."
export function compilePitch(stageRows: StageRow[]): CompiledPitch {
  const byStage = new Map(stageRows.map((r) => [r.stage_number, r]))

  return {
    problemStatement: artifactText(byStage.get(1)),
    existingSolutions: artifactText(byStage.get(2)),
    selectedConcept: artifactText(byStage.get(4)),
    howItWorks: artifactText(byStage.get(5)),
    nameAndTagline: artifactText(byStage.get(6)),
    readiness: [1, 2, 3, 4, 5, 6].map((n) => ({
      stageNumber: n,
      ready: byStage.get(n)?.status === 'complete',
    })),
  }
}

export function isPitchReady(compiled: CompiledPitch): boolean {
  return compiled.readiness.every((r) => r.ready)
}
