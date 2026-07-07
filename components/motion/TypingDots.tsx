'use client'

import { motion, useReducedMotion } from 'framer-motion'

// The coach's "thinking" indicator while waiting for the first token.
// prefers-reduced-motion: dots still show (so the state is visible), just
// without the bounce — a static ellipsis instead of a moving one.
export default function TypingDots() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <span
      className="inline-flex items-center gap-1 px-1"
      role="status"
      aria-label="Coach is typing"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-stone-400"
          animate={shouldReduceMotion ? undefined : { y: [0, -4, 0] }}
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }
          }
        />
      ))}
    </span>
  )
}
