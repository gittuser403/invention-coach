'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

// Understated completion moment — PRD is explicit this should never be a
// garish "prize" effect. A checkmark that settles in with a soft glow that
// fades once, not a repeating animation and not confetti.
export default function CelebratePulse({ show }: { show: boolean }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    // initial={false}: a stage that's already complete on page load appears
    // instantly, no entrance animation — only a completion that happens
    // live, in this session, should play the celebration.
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          role="status"
          aria-label="Stage marked complete"
          className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"
          initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 400, damping: 15 }
          }
        >
          {!shouldReduceMotion && (
            <motion.span
              className="absolute inset-0 rounded-full bg-brand-400"
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          )}
          <svg viewBox="0 0 20 20" fill="currentColor" className="relative h-3 w-3">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4l2.3 2.29 6.3-6.29a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        </motion.span>
      )}
    </AnimatePresence>
  )
}
