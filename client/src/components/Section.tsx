import { Link } from 'react-router-dom'
import type { Tile } from '@/types'
import { TileCard } from './TileCard'

export function Section({ title, items, showAllHref, circle }: {
  title: string
  items: Tile[]
  showAllHref?: string
  circle?: boolean
}) {
  if (!items.length) return null
  return (
    <section className="px-6 pb-4">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">{title}</h2>
        {showAllHref && (
          <Link to={showAllHref} className="text-sm text-[var(--color-text-muted)] hover:underline font-bold">Show all</Link>
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {items.slice(0, 6).map((t) => <TileCard key={t.id} tile={t} circle={circle} />)}
      </div>
    </section>
  )
}
