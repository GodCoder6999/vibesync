import { useNavigate, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import { useState, useEffect } from 'react'

export default function Topbar() {
  const nav = useNavigate()
  const loc = useLocation()
  const [q, setQ] = useState('')

  useEffect(() => {
    if (loc.pathname.startsWith('/search/')) {
      setQ(decodeURIComponent(loc.pathname.slice('/search/'.length)))
    }
  }, [loc.pathname])

  function go(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim()) nav(`/search/${encodeURIComponent(q.trim())}`)
  }

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

      {loc.pathname.startsWith('/search') && (
        <form onSubmit={go} className="flex-1 max-w-[400px]">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-bg-elevated)] focus-within:ring-2 ring-white">
            <Icon name="search" className="w-5 h-5 text-[var(--color-text-muted)]" filled />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What do you want to play?"
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </form>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-full bg-black text-xs font-bold text-white hover:scale-105">Explore Premium</button>
        <button className="w-8 h-8 rounded-full bg-black grid place-items-center text-white">U</button>
      </div>
    </header>
  )
}
