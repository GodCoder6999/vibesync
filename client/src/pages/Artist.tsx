import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ActionBar, TrackTable } from './DetailShared'
import { Section } from '@/components/Section'
import { HeroSkeleton, TrackRowSkeleton, SectionSkeleton } from '@/components/Skeleton'
import { useDominantColor } from '@/hooks/useDominantColor'
import type { Tile } from '@/types'

export default function Artist() {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['ar', id],
    queryFn: () => api.artist(id!),
    enabled: !!id,
  })

  if (!id) return <div className="p-6 text-red-400">Missing artist id</div>
  if (isLoading) return <div><HeroSkeleton /><TrackRowSkeleton count={5} /><SectionSkeleton title="Discography" /></div>
  if (error)     return <div className="p-6 text-red-400">Failed: {(error as Error)?.message || String(error)}</div>
  if (!data)     return <div className="p-6 text-yellow-400">No data for {id}</div>

  const albums: Tile[] = (data.albums || []).map((a: any) => ({
    ...a,
    type: 'sx-album',
  }))

  return (
    <div>
      <ArtistHero img={data.img} name={data.name} followers={data.follower_count || 0} />
      <RestOfArtist data={data} albums={albums} />
    </div>
  )
}

function ArtistHero({ img, name, followers }: { img?: string; name: string; followers: number }) {
  useDominantColor(img) // warm cache
  return (
    <div
      className="relative h-[420px] flex items-end pb-12 px-6"
      style={{ background: img ? `linear-gradient(to bottom, transparent, #000), url("${img}") center/cover` : '#535353' }}
    >
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">✓ Verified Artist</div>
          <h1 className="text-7xl font-extrabold text-white">{name}</h1>
          <div className="text-sm text-white mt-3">{followers.toLocaleString()} monthly listeners</div>
        </div>
    </div>
  )
}

function RestOfArtist({ data, albums }: { data: any; albums: Tile[] }) {
  return (
    <>
      <ActionBar tracks={data.top_songs || []} />
      <section className="px-6 py-4">
        <h2 className="text-2xl font-bold text-white mb-4">Popular</h2>
        <TrackTable tracks={(data.top_songs || []).slice(0, 5)} />
      </section>
      <Section title="Discography" items={albums} />
    </>
  )
}
