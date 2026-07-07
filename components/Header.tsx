import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
      <Link
        href={user ? '/dashboard' : '/'}
        className="rounded-sm text-sm font-semibold text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Invention Coach
      </Link>
      {user && (
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-[36px] rounded-md px-2 text-xs font-medium text-stone-500 transition-colors hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Sign out
          </button>
        </form>
      )}
    </header>
  )
}
