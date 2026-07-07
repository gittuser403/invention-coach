'use client'

import { motion, useReducedMotion } from 'framer-motion'

// Soft, slow-drifting blurred shapes behind the login card — decorative
// only (aria-hidden), never competing with content for attention. Frozen
// in place (no drift) under prefers-reduced-motion rather than removed
// entirely, so the visual warmth stays without the motion.
export default function AmbientBackground() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      data-testid="ambient-background"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        data-testid="ambient-blob"
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl"
        animate={
          shouldReduceMotion
            ? undefined
            : { x: [0, 30, 0], y: [0, 20, 0] }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <motion.div
        data-testid="ambient-blob"
        className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-celebrate-400/20 blur-3xl"
        animate={
          shouldReduceMotion
            ? undefined
            : { x: [0, -25, 0], y: [0, -15, 0] }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }
        }
      />
    </div>
  )
}
