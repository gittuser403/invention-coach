'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { signInWithGoogle } from '@/app/auth/actions'
import AmbientBackground from '@/components/motion/AmbientBackground'

// Extracted from the login page (a Server Component reading searchParams)
// so the entrance/hover animations can use Framer Motion, which needs a
// Client Component boundary.
export default function LoginCard({
  error,
  message,
}: {
  error?: string
  message?: string
}) {
  const shouldReduceMotion = useReducedMotion()

  const cardMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      }

  const itemMotion = (delay: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, delay, ease: 'easeOut' as const },
        }

  return (
    <main className="relative flex min-h-[calc(100vh-57px)] items-center justify-center overflow-hidden bg-stone-50 px-4 py-10">
      <AmbientBackground />

      <motion.div
        {...cardMotion}
        className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white/90 p-8 shadow-[0_8px_30px_-12px_rgba(15,118,110,0.25)] backdrop-blur-sm"
      >
        <motion.div {...itemMotion(0.05)} className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-700" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2Zm-2 17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.5h-4V19Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-stone-900">Invention Coach</h1>
          <p className="mt-2 text-sm text-stone-500">
            Sign in to start (or continue) your invention journey.
          </p>
        </motion.div>

        <div aria-live="polite" className="mt-5">
          {error && (
            <motion.p
              {...itemMotion(0)}
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </motion.p>
          )}
          {message && (
            <motion.p {...itemMotion(0)} className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
              {message}
            </motion.p>
          )}
        </div>

        <motion.form {...itemMotion(0.15)} action={signInWithGoogle} className="mt-6">
          <motion.button
            type="submit"
            whileHover={shouldReduceMotion ? undefined : { scale: 1.015 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.54 5.54 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.56-5.17 3.56-8.83Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3a7.4 7.4 0 0 1-4.07 1.16c-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.27a12 12 0 0 0 0 10.8l4-3.11Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.76 0 3.35.6 4.6 1.79l3.45-3.45C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.6l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
              />
            </svg>
            Continue with Google
          </motion.button>
        </motion.form>
      </motion.div>
    </main>
  )
}
