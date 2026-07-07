// Canonical 7-stage config — one source of truth for the dashboard, the
// per-stage StageView component (Phase 3), and the coaching API route
// (Phase 2). Adding or adjusting a stage is a config change here, not a
// new route/component (locked in during /plan-eng-review, Code Quality
// Issue 5).
export type StageConfig = {
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7
  title: string
  focus: string
  artifactLabel: string
}

export const STAGES: StageConfig[] = [
  {
    number: 1,
    title: 'Problem Identification',
    focus: 'Land on a real, specific problem worth solving.',
    artifactLabel: 'Problem statement',
  },
  {
    number: 2,
    title: 'Research & Existing Solutions',
    focus: 'Understand what already exists before assuming your idea is novel.',
    artifactLabel: 'Competitive landscape summary',
  },
  {
    number: 3,
    title: 'Ideation',
    focus: 'Generate multiple candidate solutions before narrowing.',
    artifactLabel: '2-3 candidate concepts',
  },
  {
    number: 4,
    title: 'Concept Selection & Refinement',
    focus: 'Evaluate feasibility, novelty, and impact of each concept.',
    artifactLabel: 'Selected concept + rationale',
  },
  {
    number: 5,
    title: 'How It Works',
    focus: 'Articulate the mechanism clearly enough to explain to someone else.',
    artifactLabel: 'Technical description + diagram description',
  },
  {
    number: 6,
    title: 'Naming & Branding',
    focus: 'Name your invention.',
    artifactLabel: 'Invention name + tagline',
  },
  {
    number: 7,
    title: 'Pitch Assembly',
    focus: 'Synthesize all prior artifacts into a pitch-ready one-pager.',
    artifactLabel: 'Final pitch one-pager',
  },
]

export const TOTAL_STAGES = STAGES.length
