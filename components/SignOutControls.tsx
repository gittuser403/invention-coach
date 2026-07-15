'use client'

import { useState, useTransition } from 'react'
import { signOut, signOutAndForgetData } from '@/app/auth/actions'

// Sign-out pair: a plain sign out, and a "forget me" sign out that erases
// every chat and stage the student owns. The erase path is two-step —
// destructive and irreversible, so it never fires on a single click.
export default function SignOutControls() {
  const [confirmingErase, setConfirmingErase] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirmingErase) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-stone-500 sm:inline">
          Erase all chats and progress? This can&apos;t be undone.
        </span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => signOutAndForgetData())}
          className="min-h-[36px] rounded-md bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          {isPending ? 'Erasing...' : 'Yes, erase everything'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirmingErase(false)}
          className="min-h-[36px] rounded-md px-3 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setConfirmingErase(true)}
        className="min-h-[36px] rounded-md px-3 text-xs font-medium text-stone-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Sign out &amp; erase my data
      </button>
      <button
        type="button"
        onClick={() => startTransition(() => signOut())}
        disabled={isPending}
        className="min-h-[36px] rounded-md px-3 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Sign out
      </button>
    </div>
  )
}
