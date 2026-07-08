'use client'

import { useState, useRef, useEffect } from 'react'
import { saveArtifact, setStageComplete } from '@/app/stage/actions'
import CelebratePulse from '@/components/motion/CelebratePulse'

// Deliberately a plain textarea the student types into themselves — the
// hard product rule (PRD 5.1 / system prompt) is that no UI shortcut may
// ever fill this in for them. Autosaves on a debounce, no manual save
// button, per the Phase 2 brief.
export default function ArtifactEditor({
  stageNumber,
  artifactLabel,
  initialText,
  initialComplete,
}: {
  stageNumber: number
  artifactLabel: string
  initialText: string
  initialComplete: boolean
}) {
  const [text, setText] = useState(initialText)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [revisitNotice, setRevisitNotice] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(initialComplete)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaId = `artifact-stage-${stageNumber}`

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleChange(value: string) {
    setText(value)
    setSaveState('idle')
    setSaveError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaveState('saving')
      const { error, revisitNotice } = await saveArtifact(stageNumber, value)
      if (error) {
        setSaveState('idle')
        setSaveError(error)
      } else {
        setSaveState('saved')
      }
      setRevisitNotice(revisitNotice)
    }, 2000)
  }

  async function handleToggleComplete() {
    setCompleteError(null)
    const next = !isComplete
    // Save whatever's currently typed in the same call — don't depend on
    // the debounced autosave having already landed (see actions.ts).
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const { error } = await setStageComplete(stageNumber, next, text)
    if (error) {
      setCompleteError(error)
      return
    }
    setSaveState('saved')
    setIsComplete(next)
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={textareaId} className="text-sm font-medium text-stone-800">
          {artifactLabel}
        </label>
        <span className="text-xs text-stone-400" aria-live="polite">
          {saveState === 'saving' && 'Saving...'}
          {saveState === 'saved' && 'Saved'}
        </span>
      </div>
      <textarea
        id={textareaId}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={4}
        placeholder="Write this in your own words — your coach can only nudge, not fill this in for you."
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      />

      {saveError && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          Couldn&apos;t save: {saveError}
        </p>
      )}

      {revisitNotice && (
        <p className="mt-2 rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-800">
          {revisitNotice}
        </p>
      )}

      {completeError && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {completeError}
        </p>
      )}

      <label className="mt-3 flex min-h-[44px] items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={isComplete}
          onChange={handleToggleComplete}
          className="h-4 w-4 rounded border-stone-300 text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        />
        Mark this stage complete
        <CelebratePulse show={isComplete} />
      </label>
    </div>
  )
}
