import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { HeroHeader, ActionBar, TrackTable } from './DetailShared'

export default function Podcast() {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['pod', id],
    queryFn: () => api.podcast(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-6 text-[var(--color-text-muted)]">Loading…</div>
  if (error)     return <div className="p-6 text-red-400">Failed: {String(error)}</div>
  if (!data)     return null

  return (
    <div>
      <HeroHeader kind="Podcast" title={data.title} subtitle={data.subtitle} img={data.img} count={data.episodes.length} />
      {data.description && <p className="px-6 pb-4 text-[var(--color-text-muted)] max-w-3xl">{data.description}</p>}
      <ActionBar tracks={data.episodes as any} />
      <TrackTable tracks={data.episodes as any} />
    </div>
  )
}
