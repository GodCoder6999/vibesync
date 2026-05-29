import { useNavigate, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import SearchBar from './SearchBar'
import AccountMenu from './AccountMenu'
import { useAuth } from '@/stores/authStore'

export default function Topbar() {
  const nav = useNavigate()
  const loc = useLocation()
  const isHome = loc.pathname === '/'

  return (
    <header className="flex items-center gap-4 px-4 py-2 bg-gradient-to-b from-black/40 to-transparent">
      <div className="hidden md:grid w-10 h-10 place-items-center text-white shrink-0">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.18-.96-.6-.12-.421.18-.84.6-.96 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.141zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      </div>

      <div className="flex gap-2 shrink-0">
        <button onClick={() => nav(-1)} className="w-8 h-8 grid place-items-center rounded-full bg-black/70 hover:bg-black">
          <Icon name="arrowL" className="w-4 h-4" filled />
        </button>
        <button onClick={() => nav(1)} className="w-8 h-8 grid place-items-center rounded-full bg-black/70 hover:bg-black">
          <Icon name="arrowR" className="w-4 h-4" filled />
        </button>
      </div>

      <div className="flex-1 flex justify-center items-center gap-2">
        <button
          onClick={() => nav('/')}
          title="Home"
          className={`w-12 h-12 grid place-items-center rounded-full ${isHome ? 'bg-[var(--color-bg-elevated)] text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-white'}`}
        >
          <Icon name="home" className="w-6 h-6" filled />
        </button>
        <SearchBar />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          className="hidden lg:inline px-4 py-2 rounded-full text-sm font-bold bg-white text-black hover:scale-105 transition-transform"
          aria-label="Explore Premium"
          title="Explore Premium"
        >
          Explore Premium
        </button>
        <button
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-[var(--color-text-muted)] hover:text-white hover:scale-105 transition-transform"
          aria-label="Install App"
          title="Install App"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a.75.75 0 0 1 .75.75v6.94l1.97-1.97a.75.75 0 1 1 1.06 1.06L8 12.06 4.22 8.28a.75.75 0 1 1 1.06-1.06l1.97 1.97V2.25A.75.75 0 0 1 8 1.5zM3 13.5h10v1.5H3v-1.5z"/></svg>
          Install App
        </button>
        <button
          className="w-8 h-8 grid place-items-center text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg-hover)] rounded-full"
          aria-label="What's New"
          title="What's New"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5A4.5 4.5 0 0 0 3.5 6v2.382l-.947 1.894A.75.75 0 0 0 3.224 11.5h9.552a.75.75 0 0 0 .671-1.224L12.5 8.382V6A4.5 4.5 0 0 0 8 1.5zM6.5 13a1.5 1.5 0 0 0 3 0h-3z"/></svg>
        </button>
        <button
          className="w-8 h-8 grid place-items-center text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg-hover)] rounded-full"
          aria-label="Friend Activity"
          title="Friend Activity"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 1A1.5 1.5 0 0 1 16 2.5v8a1.5 1.5 0 0 1-1.5 1.5H7.621a.5.5 0 0 0-.354.146L4.354 15.06A.5.5 0 0 1 3.5 14.707V12.5A1.5 1.5 0 0 1 2 11V2.5A1.5 1.5 0 0 1 3.5 1h11z"/></svg>
        </button>
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
