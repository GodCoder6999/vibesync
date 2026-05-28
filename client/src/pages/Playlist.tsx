import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { HeroHeader, ActionBar, TrackTable } from './DetailShared'

export default function Playlist() {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['pl', id],
    queryFn: () => api.playlist(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-6 text-[var(--color-text-muted)]">Loading…</div>
  if (error)     return <div className="p-6 text-red-400">Failed: {String(error)}</div>
  if (!data)     return null

  const totalSec = data.tracks.reduce((s, t) => s + (t.duration || 0), 0)
  return (
    <div>
      <HeroHeader kind="Playlist" title={data.title} subtitle={data.owner || data.subtitle} img={data.img} count={data.tracks.length} totalSec={totalSec} />
      <ActionBar tracks={data.tracks} />
      <TrackTable tracks={data.tracks} showAlbum />
    </div>
  )
}
