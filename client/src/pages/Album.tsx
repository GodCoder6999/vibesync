import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { HeroHeader, ActionBar, TrackTable } from './DetailShared'
import { HeroSkeleton, TrackRowSkeleton } from '@/components/Skeleton'
import { StickyTitle } from '@/components/StickyHeader'
import { useDominantColor } from '@/hooks/useDominantColor'

export default function Album() {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['al', id],
    queryFn: () => api.album(id!),
    enabled: !!id,
  })

  if (!id) return <div className="p-6 text-red-400">Missing album id</div>
  if (isLoading) return <div><HeroSkeleton /><TrackRowSkeleton count={8} /></div>
  if (error)     return <div className="p-6 text-red-400">Failed: {(error as Error)?.message || String(error)}</div>
  if (!data)     return <div className="p-6 text-yellow-400">No data for {id}</div>

  return <AlbumInner data={data} />
}

function AlbumInner({ data }: { data: any }) {
  const color = useDominantColor(data.img)
  return (
    <div>
      <StickyTitle title={data.title} tracks={data.tracks} color={color} />
      <HeroHeader kind="Album" title={data.title} subtitle={`${data.subtitle || ''}${data.year ? ' • ' + data.year : ''}`} img={data.img} count={data.tracks.length} />
      <ActionBar tracks={data.tracks} />
      <TrackTable tracks={data.tracks} />
    </div>
  )
}
