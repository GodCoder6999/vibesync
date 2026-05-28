import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Icon } from './Icon'
import { api } from '@/lib/api'
import type { Tile } from '@/types'

const ROUTE: Record<string, (id: string) => string> = {
  'sx-playlist': (id) => `/playlist/${id}`,
  'sx-album':    (id) => `/album/${id}`,
  'sx-artist':   (id) => `/artist/${id}`,
  'sx-podcast':  (id) => `/podcast/${id}`,
  'sx-episode':  (id) => `/episode/${id}`,
}

const PREFETCH: Record<string, [string, (id: string) => Promise<unknown>]> = {
  'sx-playlist': ['pl', (id) => api.playlist(id)],
  'sx-album':    ['al', (id) => api.album(id)],
  'sx-artist':   ['ar', (id) => api.artist(id)],
  'sx-podcast':  ['pod', (id) => api.podcast(id)],
  'sx-episode':  ['ep', (id) => api.episode(id)],
}

export function TileCard({ tile, circle }: { tile: Tile; circle?: boolean }) {
  const nav = useNavigate()
  const qc = useQueryClient()
  const go = () => {
    const fn = ROUTE[tile.type]
    if (fn) nav(fn(tile.id))
  }
  const prefetch = () => {
    const p = PREFETCH[tile.type]
    if (!p || !tile.id) return
    const [prefix, fetcher] = p
    qc.prefetchQuery({
      queryKey: [prefix, tile.id],
      queryFn: () => fetcher(tile.id),
      staleTime: 30 * 60_000,
    })
  }
  return (
    <div
      onClick={go}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') go() }}
      className="group relative p-4 rounded-md bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] transition cursor-pointer"
    >
      <div
        className={`mb-3 aspect-square ${circle ? 'rounded-full' : 'rounded-md'} bg-[var(--color-bg-pressed)] bg-cover bg-center shadow-[0_8px_24px_rgba(0,0,0,0.5)]`}
        style={{ backgroundImage: tile.img ? `url("${tile.img}")` : undefined }}
      />
      <div className="text-white font-bold truncate">{tile.title}</div>
      <div className="text-sm text-[var(--color-text-muted)] truncate">{tile.subtitle}</div>
      <span
        onClick={(e) => { e.stopPropagation(); go() }}
        className="absolute right-6 bottom-[88px] w-12 h-12 rounded-full bg-[var(--color-accent)] text-black grid place-items-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition shadow-lg"
        title="Open"
      >
        <Icon name="play" className="w-5 h-5" filled />
      </span>
    </div>
  )
}
