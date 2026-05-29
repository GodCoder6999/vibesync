import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const { sidebarCollapsed, toggleSidebar, libFilter, setLibFilter, libSort, setLibSort, libView, setLibView, toast, openMenu } = useUi()
  const user = useAuth((s) => s.user)
  const nav = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const SORT_LABELS: Record<typeof libSort, string> = {
    recents: 'Recents',
    'recently-added': 'Recently Added',
    alphabetical: 'Alphabetical',
    creator: 'Creator',
  }
  function openSortMenu(e: React.MouseEvent) {
    e.preventDefault()
    const sorts: (typeof libSort)[] = ['recents', 'recently-added', 'alphabetical', 'creator']
    openMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Sort by', onClick: () => {}, divider: true },
        ...sorts.map((s) => ({ label: SORT_LABELS[s] + (libSort === s ? '  ✓' : ''), onClick: () => setLibSort(s) })),
        { label: 'View as', onClick: () => {}, divider: true },
        { label: 'Compact' + (libView === 'compact' ? '  ✓' : ''), onClick: () => setLibView('compact') },
        { label: 'List' + (libView === 'list' ? '  ✓' : ''), onClick: () => setLibView('list') },
        { label: 'Grid' + (libView === 'grid' ? '  ✓' : ''), onClick: () => setLibView('grid') },
      ],
    })
  }

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

  type Item = { id: string; kind: 'liked' | 'mine'; title: string; sub: string; pinned: boolean; href: string; cover?: string | null; match: 'playlists' | 'artists' }
  const items: Item[] = [
    { id: 'liked', kind: 'liked', title: 'Liked Songs', sub: `Playlist · ${liked} song${liked === 1 ? '' : 's'}`, pinned: true, href: '/library', match: 'playlists' },
    ...myPls.map((p) => ({ id: p.id, kind: 'mine' as const, title: p.title, sub: `Playlist · ${user?.display_name || user?.email || 'You'}`, href: `/me/playlist/${p.id}`, pinned: false, cover: p.cover_url, match: 'playlists' as const })),
  ]

  let filtered = items.filter((it) => {
    if (libFilter === 'all') return true
    if (libFilter === 'playlists') return it.match === 'playlists'
    return false
  }).filter((it) => !search || it.title.toLowerCase().includes(search.toLowerCase()))

  if (libSort === 'alphabetical') filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
  if (libSort === 'creator') filtered = [...filtered].sort((a, b) => a.sub.localeCompare(b.sub))

  return (
    <aside style={{ width: compact ? 80 : width }} className="relative flex flex-col gap-2 transition-[width] duration-150 shrink-0">
      <div className="bg-[var(--color-bg-panel)] rounded-lg flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 pb-2">
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-3 text-[var(--color-text-muted)] hover:text-white"
            aria-label={compact ? 'Expand Your Library' : 'Collapse Your Library'}
            title={compact ? 'Expand Your Library' : 'Collapse Your Library'}
          >
            <Icon name="library" className="w-6 h-6" filled />
            {!compact && <span className="font-bold text-white">Your Library</span>}
          </button>
          {!compact && (
            <button
              onClick={createPl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-pressed)] text-sm font-bold text-white"
              aria-label="Create playlist or folder"
              title="Create playlist or folder"
            >
              <span className="text-lg leading-none">+</span> Create
            </button>
          )}
        </header>

        {!compact && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {(['playlists','artists'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setLibFilter(libFilter === k ? 'all' : k)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap font-medium ${libFilter === k ? 'bg-white text-black' : 'bg-[var(--color-bg-hover)] text-white hover:bg-[var(--color-bg-pressed)]'}`}
              >
                {k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        )}

        {!compact && (
          <div className="px-4 pb-2 flex items-center justify-between text-[var(--color-text-muted)] text-sm">
            <div className="flex items-center gap-2">
              {searchOpen ? (
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => { if (!search) setSearchOpen(false) }}
                  placeholder="Search in Your Library"
                  className="bg-[var(--color-bg-hover)] px-3 py-1 rounded text-sm text-white outline-none w-44"
                />
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-8 h-8 grid place-items-center hover:bg-[var(--color-bg-hover)] rounded-full"
                  aria-label="Search in Your Library"
                  title="Search in Your Library"
                >
                  <Icon name="search" className="w-4 h-4" filled />
                </button>
              )}
            </div>
            <button
              onClick={openSortMenu}
              className="flex items-center gap-2 text-xs text-white hover:text-white"
              aria-label={`${SORT_LABELS[libSort]}, ${libView} view`}
              title={`${SORT_LABELS[libSort]}, ${libView} view`}
            >
              {SORT_LABELS[libSort]}
              {libView === 'list' && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M15 14.5H1V13h14v1.5zm0-4H1V9h14v1.5zm0-4H1V5h14v1.5zM15 2.5H1V1h14v1.5z"/></svg>
              )}
              {libView === 'compact' && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M15 14.5H1V13h14v1.5zm0-4H1V9h14v1.5zm0-4H1V5h14v1.5z"/></svg>
              )}
              {libView === 'grid' && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/></svg>
              )}
            </button>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto pb-2 ${libView === 'grid' && !compact ? 'p-2 grid grid-cols-2 gap-2' : 'px-2'}`}>
          {filtered.length === 0 && !compact && (
            <div className="px-4 py-8 text-center text-[var(--color-text-muted)] text-sm col-span-2">No items match.</div>
          )}
          {filtered.map((it) => {
            if (libView === 'grid' && !compact) {
              return (
                <Link key={`${it.kind}-${it.id}`} to={it.href} className="p-3 rounded bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]" title={it.title}>
                  {it.kind === 'liked' ? (
                    <div className="aspect-square rounded mb-2 bg-gradient-to-br from-purple-500 to-white/80 grid place-items-center text-white">
                      <Icon name="heart" className="w-6 h-6" filled />
                    </div>
                  ) : (
                    <div className="aspect-square rounded mb-2 bg-[var(--color-bg-pressed)] grid place-items-center text-[var(--color-text-muted)] bg-cover bg-center" style={{ backgroundImage: it.cover ? `url("${it.cover}")` : undefined }}>
                      {!it.cover && '🎵'}
                    </div>
                  )}
                  <div className={`truncate text-sm ${it.pinned ? 'text-[var(--color-accent)]' : 'text-white'}`}>{it.title}</div>
                  <div className="text-xs text-[var(--color-text-muted)] truncate">{it.sub}</div>
                </Link>
              )
            }
            if (libView === 'compact' && !compact) {
              return (
                <Link key={`${it.kind}-${it.id}`} to={it.href} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-[var(--color-bg-hover)]" title={it.title}>
                  <span className={`text-xs w-4 text-[var(--color-text-muted)] ${it.pinned ? 'text-[var(--color-accent)]' : ''}`}>{it.pinned ? '📌' : '#'}</span>
                  <span className={`text-sm truncate ${it.pinned ? 'text-[var(--color-accent)]' : 'text-white'}`}>{it.title}</span>
                  <span className="text-xs text-[var(--color-text-muted)] truncate ml-auto">{it.sub.split(' · ')[0]}</span>
                </Link>
              )
            }
            return (
              <Link key={`${it.kind}-${it.id}`} to={it.href} className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-bg-hover)]" title={it.title}>
                {it.kind === 'liked' ? (
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 to-white/80 grid place-items-center text-white shrink-0">
                    <Icon name="heart" className="w-5 h-5" filled />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-[var(--color-bg-pressed)] grid place-items-center text-[var(--color-text-muted)] shrink-0 bg-cover bg-center" style={{ backgroundImage: it.cover ? `url("${it.cover}")` : undefined }}>
                    {!it.cover && '🎵'}
                  </div>
                )}
                {!compact && (
                  <div className="min-w-0 flex-1">
                    <div className={`truncate flex items-center gap-1.5 ${it.pinned ? 'text-[var(--color-accent)]' : 'text-white'}`}>
                      {it.title}
                      {it.pinned && <span title="Pinned" className="text-[var(--color-accent)] text-xs">📌</span>}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">{it.sub}</div>
                  </div>
                )}
              </Link>
            )
          })}
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
