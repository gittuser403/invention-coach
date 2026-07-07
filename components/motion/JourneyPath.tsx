'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { TOTAL_STAGES } from '@/lib/stages-config'
import type { StageStatus } from '@/lib/supabase/types'

// The "journey" progress visualization from the PRD's animation spec: a
// path that fills in as stages complete. Purely decorative/summary — the
// real per-stage navigation (with real links) lives in StageNav/the
// dashboard list right below this, so this doesn't need per-node
// keyboard interaction, just one clear text alternative for screen readers.
export default function JourneyPath({
  statusByStage,
}: {
  statusByStage: Map<number, StageStatus>
}) {
  const shouldReduceMotion = useReducedMotion()
  const completedCount = Array.from(
    { length: TOTAL_STAGES },
    (_, i) => statusByStage.get(i + 1) === 'complete'
  ).filter(Boolean).length

  const fillPercent = (completedCount / (TOTAL_STAGES - 1)) * 100

  return (
    <div
      role="img"
      aria-label={`Invention journey: ${completedCount} of ${TOTAL_STAGES} stages complete`}
      className="w-full py-2"
    >
      <div className="relative h-2 w-full rounded-full bg-stone-200">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-600"
          initial={false}
          animate={{ width: `${Math.min(fillPercent, 100)}%` }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }
          }
        />
        <div className="absolute inset-0 flex items-center justify-between px-0.5">
          {Array.from({ length: TOTAL_STAGES }, (_, i) => {
            const stageNumber = i + 1
            const status = statusByStage.get(stageNumber) ?? 'not_started'
            return (
              <motion.div
                key={stageNumber}
                aria-hidden="true"
                className={`h-3 w-3 rounded-full border-2 ${
                  status === 'complete'
                    ? 'border-brand-600 bg-brand-600'
                    : status === 'in_progress'
                      ? 'border-celebrate-500 bg-white'
                      : 'border-stone-300 bg-white'
                }`}
                initial={false}
                animate={status === 'complete' && !shouldReduceMotion ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
