import { Link, NavLink } from 'react-router-dom'
import { useLikes } from '@/stores/likesStore'
import { Icon } from './Icon'

export default function Sidebar() {
  const liked = useLikes((s) => s.tracks.length)

  return (
    <aside className="w-[300px] flex flex-col gap-2">
      <nav className="bg-[var(--color-bg-panel)] rounded-lg p-2 flex flex-col gap-1">
        <NavLink to="/" className={({ isActive }) => navCls(isActive)}>
          <Icon name="home" className="w-6 h-6" filled /> Home
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => navCls(isActive)}>
          <Icon name="search" className="w-6 h-6" /> Search
        </NavLink>
      </nav>

      <div className="bg-[var(--color-bg-panel)] rounded-lg flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 pb-2">
          <NavLink to="/library" className="flex items-center gap-3 text-[var(--color-text-muted)] hover:text-white">
            <Icon name="library" className="w-6 h-6" />
            <span className="font-bold">Your Library</span>
          </NavLink>
          <button title="Create playlist" className="w-8 h-8 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-white grid place-items-center">+</button>
        </header>

        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {['Playlists', 'Albums', 'Artists', 'Podcasts'].map((k) => (
            <button key={k} className="px-3 py-1.5 rounded-full bg-[var(--color-bg-hover)] text-sm text-white hover:bg-[var(--color-bg-pressed)]">{k}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <Link to="/library" className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-bg-hover)]">
            <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 to-white/80 grid place-items-center text-white">
              <Icon name="heart" className="w-5 h-5" filled />
            </div>
            <div className="min-w-0">
              <div className="text-white truncate">Liked Songs</div>
              <div className="text-xs text-[var(--color-text-muted)]">Playlist · {liked} song{liked === 1 ? '' : 's'}</div>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  )
}

function navCls(active: boolean) {
  return `flex items-center gap-4 p-3 rounded-md font-bold ${active ? 'text-white' : 'text-[var(--color-text-muted)]'} hover:text-white`
}
