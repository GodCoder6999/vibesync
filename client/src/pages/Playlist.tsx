import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { HeroHeader, ActionBar, TrackTable } from './DetailShared'
import { HeroSkeleton, TrackRowSkeleton } from '@/components/Skeleton'
import { StickyTitle } from '@/components/StickyHeader'
import { useDominantColor } from '@/hooks/useDominantColor'

export default function Playlist() {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['pl', id],
    queryFn: () => api.playlist(id!),
    enabled: !!id,
  })

  if (!id) return <div className="p-6 text-red-400">Missing playlist id in URL</div>
  if (isLoading) return <div><HeroSkeleton /><TrackRowSkeleton count={8} /></div>
  if (error)     return <div className="p-6 text-red-400">Failed: {(error as Error)?.message || String(error)}</div>
  if (!data)     return <div className="p-6 text-yellow-400">No data returned for {id}</div>

  const totalSec = data.tracks.reduce((s, t) => s + (t.duration || 0), 0)
  return <PlaylistInner data={data} totalSec={totalSec} />
}

function PlaylistInner({ data, totalSec }: { data: any; totalSec: number }) {
  const color = useDominantColor(data.img)
  return (
    <div>
      <StickyTitle title={data.title} tracks={data.tracks} color={color} />
      <HeroHeader kind="Playlist" title={data.title} subtitle={data.owner || data.subtitle} img={data.img} count={data.tracks.length} totalSec={totalSec} />
      <ActionBar tracks={data.tracks} />
      <TrackTable tracks={data.tracks} showAlbum />
    </div>
  )
}
