import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { HeroHeader, ActionBar, TrackTable } from './DetailShared'

export default function Album() {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['al', id],
    queryFn: () => api.album(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-6 text-[var(--color-text-muted)]">Loading…</div>
  if (error)     return <div className="p-6 text-red-400">Failed: {String(error)}</div>
  if (!data)     return null

  return (
    <div>
      <HeroHeader kind="Album" title={data.title} subtitle={`${data.subtitle || ''}${data.year ? ' • ' + data.year : ''}`} img={data.img} count={data.tracks.length} />
      <ActionBar tracks={data.tracks} />
      <TrackTable tracks={data.tracks} />
    </div>
  )
}
