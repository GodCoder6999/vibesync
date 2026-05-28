import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ActionBar, TrackTable } from './DetailShared'
import { Section } from '@/components/Section'
import type { Tile } from '@/types'

export default function Artist() {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['ar', id],
    queryFn: () => api.artist(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-6 text-[var(--color-text-muted)]">Loading…</div>
  if (error)     return <div className="p-6 text-red-400">Failed: {String(error)}</div>
  if (!data)     return null

  const albums: Tile[] = (data.albums || []).map((a: any) => ({
    ...a,
    type: 'sx-album',
  }))

  return (
    <div>
      <div className="relative h-[420px] flex items-end pb-12 px-6" style={{ background: data.img ? `linear-gradient(to bottom, transparent, #000), url("${data.img}") center/cover` : '#535353' }}>
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">✓ Verified Artist</div>
          <h1 className="text-7xl font-extrabold text-white">{data.name}</h1>
          <div className="text-sm text-white mt-3">{(data.follower_count || 0).toLocaleString()} monthly listeners</div>
        </div>
      </div>

      <ActionBar tracks={data.top_songs || []} />

      <section className="px-6 py-4">
        <h2 className="text-2xl font-bold text-white mb-4">Popular</h2>
        <TrackTable tracks={(data.top_songs || []).slice(0, 5)} />
      </section>

      <Section title="Discography" items={albums} />
    </div>
  )
}
