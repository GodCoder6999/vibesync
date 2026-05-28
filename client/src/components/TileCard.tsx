import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import type { Tile } from '@/types'

const ROUTE: Record<string, (id: string) => string> = {
  'sx-playlist': (id) => `/playlist/${id}`,
  'sx-album':    (id) => `/album/${id}`,
  'sx-artist':   (id) => `/artist/${id}`,
  'sx-podcast':  (id) => `/podcast/${id}`,
  'sx-episode':  (id) => `/episode/${id}`,
}

export function TileCard({ tile, circle }: { tile: Tile; circle?: boolean }) {
  const nav = useNavigate()
  const go = () => {
    const fn = ROUTE[tile.type]
    if (fn) nav(fn(tile.id))
  }
  return (
    <div
      onClick={go}
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
