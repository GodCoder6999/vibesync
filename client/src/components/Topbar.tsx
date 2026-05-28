import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import SearchBar from './SearchBar'
import AccountMenu from './AccountMenu'
import { useAuth } from '@/stores/authStore'

export default function Topbar() {
  const nav = useNavigate()

  return (
    <header className="flex items-center gap-4 px-6 py-3 bg-gradient-to-b from-black/40 to-transparent">
      <div className="flex gap-2">
        <button onClick={() => nav(-1)} className="w-8 h-8 grid place-items-center rounded-full bg-black/70 hover:bg-black">
          <Icon name="arrowL" className="w-4 h-4" filled />
        </button>
        <button onClick={() => nav(1)} className="w-8 h-8 grid place-items-center rounded-full bg-black/70 hover:bg-black">
          <Icon name="arrowR" className="w-4 h-4" filled />
        </button>
      </div>

      <SearchBar />

      <div className="ml-auto flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-full bg-black text-xs font-bold text-white hover:scale-105">Explore Premium</button>
        <SignInOrAccount />
      </div>
    </header>
  )
}

function SignInOrAccount() {
  const user = useAuth((s) => s.user)
  const nav = useNavigate()
  if (!user) {
    return (
      <button onClick={() => nav('/login')} className="px-4 py-2 rounded-full text-sm font-bold text-[var(--color-text-muted)] hover:text-white">
        Sign in
      </button>
    )
  }
  return <AccountMenu />
}
