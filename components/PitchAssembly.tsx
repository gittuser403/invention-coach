'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { STAGES } from '@/lib/stages-config'
import { isPitchReady, type CompiledPitch } from '@/lib/pitch/compile'
import { getOrCreateShareLink, setShareSettings } from '@/app/pitch/actions'
import PitchOnePager from '@/components/PitchOnePager'

export default function PitchAssembly({ pitch }: { pitch: CompiledPitch }) {
  const [share, setShare] = useState<{
    slug: string | null
    enabled: boolean
    showName: boolean
  } | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [loadingShare, setLoadingShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const notReady = pitch.readiness.filter((r) => !r.ready)
  const ready = isPitchReady(pitch)

  async function handleGetShareLink() {
    setLoadingShare(true)
    setShareError(null)
    const result = await getOrCreateShareLink()
    setLoadingShare(false)
    if (result.error) {
      setShareError(result.error)
      return
    }
    setShare({ slug: result.slug, enabled: result.enabled, showName: result.showName })
  }

  async function handleToggle(key: 'enabled' | 'showName') {
    if (!share) return
    const next = { ...share, [key]: !share[key] }
    setShare(next)
    await setShareSettings({
      enabled: key === 'enabled' ? next.enabled : undefined,
      showName: key === 'showName' ? next.showName : undefined,
    })
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = share?.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pitch/${share.slug}`
    : null

  return (
    <div className="space-y-6">
      {notReady.length > 0 && (
        <div className="rounded-md border border-celebrate-400/40 bg-celebrate-400/10 p-3 text-sm text-celebrate-600">
          <p className="font-medium">Some stages aren&apos;t marked complete yet:</p>
          <ul className="mt-1 list-inside list-disc">
            {notReady.map((r) => {
              const stage = STAGES.find((s) => s.number === r.stageNumber)
              return (
                <li key={r.stageNumber}>
                  <Link
                    href={`/stage/${r.stageNumber}`}
                    className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    Stage {r.stageNumber}: {stage?.title}
                  </Link>
                </li>
              )
            })}
          </ul>
          <p className="mt-1 text-xs">
            You can still preview and export below — this is just a nudge, not a block.
          </p>
        </div>
      )}

      {ready && (
        <div className="rounded-md border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
          All six stages are marked complete — ready to export or share.
        </div>
      )}

      <PitchOnePager pitch={pitch} />

      <div className="flex flex-wrap items-center gap-3">
        <motion.a
          href="/api/pitch/pdf"
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          className="flex min-h-[44px] items-center rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Download PDF
        </motion.a>

        {!share && (
          <motion.button
            onClick={handleGetShareLink}
            disabled={loadingShare}
            whileHover={shouldReduceMotion || loadingShare ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion || loadingShare ? undefined : { scale: 0.98 }}
            className="min-h-[44px] rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 shadow-sm transition-colors hover:bg-stone-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {loadingShare ? 'Creating link...' : 'Get shareable link'}
          </motion.button>
        )}
      </div>

      {shareError && (
        <p role="alert" className="text-xs text-red-600">
          {shareError}
        </p>
      )}

      {share && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
          <p className="mb-2 font-medium text-stone-800">Share with a teacher or judge</p>
          {shareUrl && (
            <div className="mb-3 flex items-center gap-2">
              <label htmlFor="share-url" className="sr-only">
                Shareable pitch link
              </label>
              <input
                id="share-url"
                readOnly
                value={shareUrl}
                className="min-h-[40px] flex-1 rounded-md border border-stone-300 px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => handleCopy(shareUrl)}
                className="min-h-[40px] rounded-md border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
          <label className="flex min-h-[36px] items-center gap-2 text-xs text-stone-700">
            <input
              type="checkbox"
              checked={share.enabled}
              onChange={() => handleToggle('enabled')}
              className="h-4 w-4 rounded border-stone-300 text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            />
            Link is active (turn off to stop sharing without losing the link)
          </label>
          <label className="mt-1 flex min-h-[36px] items-center gap-2 text-xs text-stone-700">
            <input
              type="checkbox"
              checked={share.showName}
              onChange={() => handleToggle('showName')}
              className="h-4 w-4 rounded border-stone-300 text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            />
            Show my name on the shared page (default: anonymous)
          </label>
        </div>
      )}
    </div>
  )
}
