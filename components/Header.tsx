import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6">
      <Link
        href={user ? '/dashboard' : '/'}
        className="flex items-center gap-2 rounded-sm text-sm font-semibold text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-700" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2Zm-2 17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.5h-4V19Z"
            />
          </svg>
        </span>
        Invention Coach
      </Link>
      {user && (
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-[36px] rounded-md px-3 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Sign out
          </button>
        </form>
      )}
    </header>
  )
}
