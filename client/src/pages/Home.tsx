import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Section } from '@/components/Section'
import { SectionSkeleton } from '@/components/Skeleton'
import { useLikes } from '@/stores/likesStore'
import { useAuth } from '@/stores/authStore'
import { playlistsApi } from '@/lib/playlists'
import { getLocalHistory } from '@/hooks/useHistory'
import { usePlayer } from '@/stores/playerStore'
import { Icon } from '@/components/Icon'
import type { Tile } from '@/types'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

type QuickPick = { id: string; title: string; cover?: string; href: string; isLiked?: boolean }

export default function Home() {
  const [filter, setFilter] = useState<'all' | 'music' | 'podcasts'>('all')
  const { data, isLoading, error } = useQuery({ queryKey: ['home'], queryFn: api.home })
  const liked = useLikes((s) => s.tracks)
  const user = useAuth((s) => s.user)
  const history = getLocalHistory()

  const { data: myPls = [] } = useQuery({
    queryKey: ['my-playlists', user?.id],
    queryFn: () => user ? playlistsApi.list(user.id) : Promise.resolve([]),
    enabled: !!user,
  })

  // Build quick-picks: Liked Songs first, then user playlists, then top curated
  const quickPicks: QuickPick[] = []
  if (liked.length) {
    quickPicks.push({ id: 'liked', title: 'Liked Songs', cover: liked[0]?.img, href: '/library', isLiked: true })
  }
  for (const p of myPls.slice(0, 5)) {
    quickPicks.push({ id: p.id, title: p.title, cover: p.cover_url || undefined, href: `/me/playlist/${p.id}` })
  }
  // Top up to 6 with curated playlists if user has few items
  for (const p of (data?.playlists ?? []).slice(0, 6 - quickPicks.length)) {
    quickPicks.push({ id: p.id, title: p.title, href: `/playlist/${p.id}` })
  }

  const rawPlaylists = (data?.playlists ?? []).slice(0, 6)
  const rawArtists = (data?.artists ?? []).slice(0, 6)
  const plQueries = useQueries({
    queries: rawPlaylists.map((p: any) => ({ queryKey: ['pl', p.id], queryFn: () => api.playlist(p.id), staleTime: 30 * 60_000 })),
  })
  const arQueries = useQueries({
    queries: rawArtists.map((a: any) => ({ queryKey: ['ar', a.id], queryFn: () => api.artist(a.id), staleTime: 30 * 60_000 })),
  })
  const quickPlCovers = useQueries({
    queries: quickPicks.filter((q) => !q.cover && !q.isLiked).slice(0, 6).map((q) => ({ queryKey: ['pl', q.id], queryFn: () => api.playlist(q.id), staleTime: 30 * 60_000 })),
  })

  const playlists: Tile[] = rawPlaylists.map((p: any, i: number) => ({ ...p, img: plQueries[i]?.data?.img || p.img || '' }))
  const artists: Tile[] = rawArtists.map((a: any, i: number) => ({ ...a, img: arQueries[i]?.data?.img || a.img || '' }))

  // Apply quickPlCovers in same-order match
  let coverIdx = 0
  for (const q of quickPicks) {
    if (!q.cover && !q.isLiked) {
      const cv = quickPlCovers[coverIdx++]?.data?.img
      if (cv) q.cover = cv
    }
  }

  return (
    <div className="bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#121212]">
      <div className="px-6 pt-4 pb-2 flex items-center gap-2">
        {(['all', 'music', 'podcasts'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-white text-black' : 'bg-[var(--color-bg-hover)] text-white hover:bg-[var(--color-bg-pressed)]'}`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-6 pt-4 pb-6">
        <h1 className="text-2xl font-extrabold text-white sr-only">{greeting()}</h1>
      </div>

      {error && <div className="mx-6 mb-4 p-3 rounded bg-red-900/50 text-red-200 text-sm">Backend error: {(error as Error)?.message}</div>}

      {quickPicks.length > 0 && (
        <QuickPickGrid items={quickPicks} />
      )}

      {isLoading ? (
        <>
          <SectionSkeleton title="It's New Music Friday!" />
          <SectionSkeleton title="Popular Artists" circle />
        </>
      ) : (
        <>
          <Section title="It's New Music Friday!" items={playlists} showAllHref="/search" />
          <Section title="Popular Artists" items={artists} circle showAllHref="/search" />
          {history.length > 0 && <RecentlyPlayedRow tracks={history} />}
          {liked.length > 0 && <MadeForYouRow />}
        </>
      )}
    </div>
  )
}

function QuickPickGrid({ items }: { items: QuickPick[] }) {
  const nav = useNavigate()
  return (
    <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.slice(0, 6).map((it) => (
        <button
          key={it.id}
          onClick={() => nav(it.href)}
          className="group flex items-center bg-white/10 hover:bg-white/20 rounded-md overflow-hidden cursor-pointer text-left transition"
        >
          {it.isLiked ? (
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-white/80 grid place-items-center text-white shrink-0">
              <Icon name="heart" className="w-7 h-7" filled />
            </div>
          ) : (
            <div className="w-20 h-20 bg-[var(--color-bg-pressed)] bg-cover bg-center shrink-0" style={{ backgroundImage: it.cover ? `url("${it.cover}")` : undefined }} />
          )}
          <div className="px-4 flex-1 min-w-0 font-bold text-white truncate">{it.title}</div>
          <div className="mr-4 w-12 h-12 rounded-full bg-[var(--color-accent)] text-black grid place-items-center opacity-0 group-hover:opacity-100 transition shrink-0">
            <Icon name="play" className="w-5 h-5" filled />
          </div>
        </button>
      ))}
    </div>
  )
}

function RecentlyPlayedRow({ tracks }: { tracks: any[] }) {
  const setQueue = usePlayer((s) => s.setQueue)
  const items = tracks.slice(0, 6).map((t) => ({ ...t, type: 'sx-track' }))
  return (
    <section className="px-6 pb-4">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Jump back in</h2>
        <a href="/recent" className="text-sm text-[var(--color-text-muted)] hover:underline font-bold">Show all</a>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {items.map((t: any, i: number) => (
          <button
            key={`${t.id}-${i}`}
            onClick={() => setQueue(tracks, i)}
            className="group relative p-4 rounded-md bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] transition text-left"
          >
            <div className="mb-3 aspect-square rounded-md bg-[var(--color-bg-pressed)] bg-cover bg-center shadow-xl" style={{ backgroundImage: t.img ? `url("${t.img}")` : undefined }} />
            <div className="text-white font-bold truncate">{t.title}</div>
            <div className="text-sm text-[var(--color-text-muted)] truncate">{t.artist}</div>
          </button>
        ))}
      </div>
    </section>
  )
}

function MadeForYouRow() {
  return (
    <section className="px-6 pb-4">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Made for You</h2>
        <a href="/made-for-you" className="text-sm text-[var(--color-text-muted)] hover:underline font-bold">Show all</a>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        <a href="/made-for-you" className="block p-4 rounded-md bg-gradient-to-br from-purple-700 to-blue-900 hover:scale-[1.02] transition">
          <div className="aspect-square rounded-md grid place-items-center text-white text-2xl font-extrabold shadow-xl mb-3">Daily Mix 1</div>
          <div className="text-white font-bold">Daily Mix 1</div>
          <div className="text-sm text-white/80">Shuffled from your Liked Songs</div>
        </a>
        <a href="/made-for-you" className="block p-4 rounded-md bg-gradient-to-br from-pink-700 to-orange-700 hover:scale-[1.02] transition">
          <div className="aspect-square rounded-md grid place-items-center text-white text-2xl font-extrabold shadow-xl mb-3">Daily Mix 2</div>
          <div className="text-white font-bold">Daily Mix 2</div>
          <div className="text-sm text-white/80">Recently played, shuffled</div>
        </a>
      </div>
    </section>
  )
}
