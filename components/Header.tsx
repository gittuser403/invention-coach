import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import SignOutControls from '@/components/SignOutControls'

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
        <Image
          src="/nextminds-icon.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 shrink-0"
          priority
        />
        <span>
          <span className="text-brand-700">NextMinds</span> Invention Coach
        </span>
      </Link>
      {user && <SignOutControls />}
    </header>
  )
}
