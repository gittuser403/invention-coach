'use client'

import { motion, useReducedMotion } from 'framer-motion'

// Soft, slow-drifting blurred shapes behind every page — decorative only
// (aria-hidden), fixed to the viewport so the NextMinds navy/orange wash
// stays visible while scrolling instead of just sitting behind the login
// card. Frozen in place (no drift) under prefers-reduced-motion rather
// than removed entirely, so the visual warmth stays without the motion.
export default function AmbientBackground() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      data-testid="ambient-background"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
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
