import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ActionBar, TrackTable } from './DetailShared'
import { Section } from '@/components/Section'
import { HeroSkeleton, TrackRowSkeleton, SectionSkeleton } from '@/components/Skeleton'
import { useDominantColor } from '@/hooks/useDominantColor'
import { useAuth } from '@/stores/authStore'
import { useUi } from '@/stores/uiStore'
import { followsApi } from '@/lib/follows'
import type { Tile } from '@/types'

const useAuthState = () => useAuth((s) => s.user)
const useUiToast = () => useUi((s) => s.toast)

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
      <div className="px-6 py-4 flex items-center gap-4">
        <ActionBar tracks={data.top_songs || []} />
        <FollowArtistButton id={data.id} />
      </div>
      <section className="px-6 py-4">
        <h2 className="text-2xl font-bold text-white mb-4">Popular</h2>
        <TrackTable tracks={(data.top_songs || []).slice(0, 5)} />
      </section>
      <Section title="Discography" items={albums} />
    </>
  )
}

function FollowArtistButton({ id }: { id: string }) {
  const me = useAuthState()
  const toast = useUiToast()
  const [following, setFollowing] = useState(false)
  useEffect(() => { if (me) followsApi.isFollowing(me.id, 'artist', id).then(setFollowing) }, [me, id])
  if (!me) return null
  return (
    <button
      onClick={async () => {
        if (following) { await followsApi.unfollow(me.id, 'artist', id); setFollowing(false); toast('Unfollowed artist') }
        else           { await followsApi.follow(me.id, 'artist', id);   setFollowing(true);  toast('Following artist') }
      }}
      className={`px-4 py-1.5 rounded-full border ${following ? 'border-white/40' : 'border-white'} text-white text-sm font-bold hover:scale-105`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
