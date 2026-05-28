import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLikes } from '@/stores/likesStore'
import { useUi } from '@/stores/uiStore'
import { useAuth } from '@/stores/authStore'
import { playlistsApi } from '@/lib/playlists'
import { Icon } from './Icon'

const MIN_WIDTH = 80
const COLLAPSE_BELOW = 200
const MAX_WIDTH = 420
const DEFAULT_WIDTH = 300

export default function Sidebar() {
  const liked = useLikes((s) => s.tracks.length)
  const { sidebarCollapsed, toggleSidebar, libFilter, setLibFilter, toast } = useUi()
  const user = useAuth((s) => s.user)
  const nav = useNavigate()
  const qc = useQueryClient()
  const { data: myPls = [] } = useQuery({
    queryKey: ['my-playlists', user?.id],
    queryFn: () => user ? playlistsApi.list(user.id) : Promise.resolve([]),
    enabled: !!user,
  })
  async function createPl() {
    if (!user) { toast('Sign in to create playlists'); return }
    const p = await playlistsApi.create(user.id, `My Playlist #${myPls.length + 1}`)
    qc.invalidateQueries({ queryKey: ['my-playlists'] })
    if (p) nav(`/me/playlist/${p.id}`)
  }

  const [width, setWidth] = useState<number>(() => {
    const v = Number(localStorage.getItem('vs-sb-width'))
    return isFinite(v) && v >= MIN_WIDTH ? v : DEFAULT_WIDTH
  })
  const draggingRef = useRef(false)
  const widthRef = useRef(width)
  useEffect(() => { widthRef.current = width }, [width])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current) return
      const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX - 8))
      setWidth(w)
    }
    function onUp() {
      if (!draggingRef.current) return
      draggingRef.current = false
      document.body.style.cursor = ''
      localStorage.setItem('vs-sb-width', String(widthRef.current))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const compact = sidebarCollapsed || width < COLLAPSE_BELOW

  return (
    <aside style={{ width: compact ? 80 : width }} className="relative flex flex-col gap-2 transition-[width] duration-150 shrink-0">
      <nav className="bg-[var(--color-bg-panel)] rounded-lg p-2 flex flex-col gap-1">
        <NavLink to="/" className={({ isActive }) => navCls(isActive, compact)} title="Home">
          <Icon name="home" className="w-6 h-6 shrink-0" filled />
          {!compact && <span>Home</span>}
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => navCls(isActive, compact)} title="Search">
          <Icon name="search" className="w-6 h-6 shrink-0" filled />
          {!compact && <span>Search</span>}
        </NavLink>
      </nav>

      <div className="bg-[var(--color-bg-panel)] rounded-lg flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 pb-2">
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-3 text-[var(--color-text-muted)] hover:text-white"
            title={compact ? 'Expand library' : 'Collapse library'}
          >
            <Icon name="library" className="w-6 h-6" filled />
            {!compact && <span className="font-bold">Your Library</span>}
          </button>
          {!compact && (
            <button onClick={createPl} title="Create playlist" className="w-8 h-8 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-white grid place-items-center text-lg">+</button>
          )}
        </header>

        {!compact && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {(['all','playlists','albums','artists','podcasts'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setLibFilter(k)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${libFilter === k ? 'bg-white text-black' : 'bg-[var(--color-bg-hover)] text-white hover:bg-[var(--color-bg-pressed)]'}`}
              >
                {k === 'all' ? 'All' : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2">
          {(libFilter === 'all' || libFilter === 'playlists') && (
            <Link to="/library" className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-bg-hover)]" title="Liked Songs">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 to-white/80 grid place-items-center text-white shrink-0">
                <Icon name="heart" className="w-5 h-5" filled />
              </div>
              {!compact && (
                <div className="min-w-0">
                  <div className="text-white truncate">Liked Songs</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Playlist · {liked} song{liked === 1 ? '' : 's'}</div>
                </div>
              )}
            </Link>
          )}

          {(libFilter === 'all' || libFilter === 'playlists') && myPls.map((p) => (
            <Link key={p.id} to={`/me/playlist/${p.id}`} className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-bg-hover)]" title={p.title}>
              <div className="w-12 h-12 rounded bg-[var(--color-bg-pressed)] grid place-items-center text-[var(--color-text-muted)] shrink-0 bg-cover bg-center" style={{ backgroundImage: p.cover_url ? `url("${p.cover_url}")` : undefined }}>
                {!p.cover_url && '🎵'}
              </div>
              {!compact && (
                <div className="min-w-0">
                  <div className="text-white truncate">{p.title}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Playlist · {user?.display_name || user?.email}</div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div
        onMouseDown={() => { draggingRef.current = true; document.body.style.cursor = 'col-resize' }}
        className="absolute top-0 right-[-4px] w-2 h-full cursor-col-resize hover:bg-white/10 z-10"
        title="Drag to resize"
      />
    </aside>
  )
}

function navCls(active: boolean, compact: boolean) {
  return `flex items-center gap-4 p-3 rounded-md font-bold ${compact ? 'justify-center' : ''} ${active ? 'text-white' : 'text-[var(--color-text-muted)]'} hover:text-white`
}
