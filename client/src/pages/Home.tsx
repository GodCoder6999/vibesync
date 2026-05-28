import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useLikes } from '@/stores/likesStore'
import { useAuth } from '@/stores/authStore'
import { playlistsApi } from '@/lib/playlists'
import { getLocalHistory } from '@/hooks/useHistory'
import { usePlayer } from '@/stores/playerStore'
import { Icon } from '@/components/Icon'
import { CardSkeleton } from '@/components/Skeleton'
import { HOME_SECTIONS, POPULAR_ARTIST_IDS } from '@/lib/homeSections'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

type QuickPick = { id: string; title: string; cover?: string; href: string; isLiked?: boolean }

export default function Home() {
  const [filter, setFilter] = useState<'all' | 'music' | 'podcasts'>('all')
  const liked = useLikes((s) => s.tracks)
  const user = useAuth((s) => s.user)
  const history = getLocalHistory()

  const { data: myPls = [] } = useQuery({
    queryKey: ['my-playlists', user?.id],
    queryFn: () => user ? playlistsApi.list(user.id) : Promise.resolve([]),
    enabled: !!user,
  })

  // Quick picks: Liked Songs + user playlists + top curated
  const quickPicks: QuickPick[] = []
  if (liked.length) quickPicks.push({ id: 'liked', title: 'Liked Songs', cover: liked[0]?.img, href: '/library', isLiked: true })
  for (const p of myPls.slice(0, 5)) quickPicks.push({ id: p.id, title: p.title, cover: p.cover_url || undefined, href: `/me/playlist/${p.id}` })
  for (const pid of ['37i9dQZF1DXcBWIGoYBM5M', '37i9dQZF1DX0XUsuxWHRQd', '37i9dQZF1DX4WYpdgoIcn6']) {
    if (quickPicks.length >= 8) break
    quickPicks.push({ id: pid, title: '', href: `/playlist/${pid}` })
  }
  // Lazy-load covers + titles for unresolved quick picks
  const qpFetches = useQueries({
    queries: quickPicks.filter((q) => !q.isLiked && !q.cover).map((q) => ({
      queryKey: ['pl', q.id],
      queryFn: () => api.playlist(q.id),
      staleTime: 30 * 60_000,
    })),
  })
  let fi = 0
  for (const q of quickPicks) {
    if (!q.isLiked && !q.cover) {
      const d = qpFetches[fi++]?.data
      if (d) { q.cover = d.img; if (!q.title) q.title = d.title }
    }
  }

  const userName = user?.display_name || user?.email?.split('@')[0] || 'you'

  return (
    <div className="bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#121212]">
      <div className="px-6 pt-4 pb-2 flex items-center gap-2">
        {(['all', 'music', 'podcasts'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === f ? 'bg-white text-black' : 'bg-[var(--color-bg-hover)] text-white hover:bg-[var(--color-bg-pressed)]'}`}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-6 pt-4 pb-4">
        <h1 className="text-3xl font-extrabold text-white">{greeting()}</h1>
      </div>

      <QuickPickGrid items={quickPicks.slice(0, 8)} />

      <PlaylistSection title="It's New Music Friday!" ids={HOME_SECTIONS[0].ids} />

      <PersonalRow title={`Made For ${userName}`} liked={liked} history={history} />

      {history.length > 0 && (
        <Section title="Inspired by your recent activity" subtitle="Recommended for today" items={history.slice(0, 8).map((t: any) => ({ ...t, kind: 'history' }))} />
      )}

      <ArtistSection ids={POPULAR_ARTIST_IDS} />

      <AlbumSection title="Popular albums and singles" ids={HOME_SECTIONS[1].ids} />

      <PlaylistSection title="Your top mixes" ids={HOME_SECTIONS[2].ids} />

      <PlaylistSection title="What's New" ids={HOME_SECTIONS[3].ids} />

      <PlaylistSection title="Recommended Stations" subtitle="Non-stop music based on your favorite songs and artists." ids={HOME_SECTIONS[4].ids} />
    </div>
  )
}

function QuickPickGrid({ items }: { items: QuickPick[] }) {
  const nav = useNavigate()
  if (!items.length) return null
  return (
    <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((it) => (
        <button key={it.id} onClick={() => nav(it.href)} className="group flex items-center bg-white/10 hover:bg-white/20 rounded-md overflow-hidden cursor-pointer text-left transition">
          {it.isLiked ? (
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-white/80 grid place-items-center text-white shrink-0">
              <Icon name="heart" className="w-7 h-7" filled />
            </div>
          ) : (
            <div className="w-20 h-20 bg-[var(--color-bg-pressed)] bg-cover bg-center shrink-0" style={{ backgroundImage: it.cover ? `url("${it.cover}")` : undefined }} />
          )}
          <div className="px-4 flex-1 min-w-0 font-bold text-white truncate">{it.title || 'Loading…'}</div>
          <div className="mr-4 w-12 h-12 rounded-full bg-[var(--color-accent)] text-black grid place-items-center opacity-0 group-hover:opacity-100 transition shrink-0">
            <Icon name="play" className="w-5 h-5" filled />
          </div>
        </button>
      ))}
    </div>
  )
}

function PlaylistSection({ title, subtitle, ids }: { title: string; subtitle?: string; ids: string[] }) {
  const queries = useQueries({
    queries: ids.map((id) => ({ queryKey: ['pl', id], queryFn: () => api.playlist(id), staleTime: 30 * 60_000 })),
  })
  return (
    <SectionShell title={title} subtitle={subtitle}>
      {queries.map((q, i) => {
        const id = ids[i]
        const d = q.data
        if (!d) return <CardSkeleton key={id} />
        return <TileLink key={id} href={`/playlist/${id}`} img={d.img} title={d.title} subtitle={d.subtitle || d.owner || 'Playlist'} />
      })}
    </SectionShell>
  )
}

function AlbumSection({ title, ids }: { title: string; ids: string[] }) {
  const queries = useQueries({
    queries: ids.map((id) => ({ queryKey: ['al', id], queryFn: () => api.album(id), staleTime: 30 * 60_000 })),
  })
  return (
    <SectionShell title={title}>
      {queries.map((q, i) => {
        const id = ids[i]
        const d = q.data
        if (!d) return <CardSkeleton key={id} />
        return <TileLink key={id} href={`/album/${id}`} img={d.img} title={d.title} subtitle={d.subtitle || 'Album'} />
      })}
    </SectionShell>
  )
}

function ArtistSection({ ids }: { ids: string[] }) {
  const queries = useQueries({
    queries: ids.map((id) => ({ queryKey: ['ar', id], queryFn: () => api.artist(id), staleTime: 30 * 60_000 })),
  })
  return (
    <SectionShell title="Popular Artists">
      {queries.map((q, i) => {
        const id = ids[i]
        const d = q.data
        if (!d) return <CardSkeleton key={id} circle />
        return <TileLink key={id} href={`/artist/${id}`} img={d.img} title={d.name} subtitle="Artist" circle />
      })}
    </SectionShell>
  )
}

function SectionShell({ title, subtitle, children }: { title: string; subtitle?: string; children: any }) {
  return (
    <section className="px-6 pb-4">
      <div className="flex items-end justify-between mb-4">
        <div>
          {subtitle && <div className="text-xs text-[var(--color-text-muted)] mb-1">{subtitle}</div>}
          <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">{title}</h2>
        </div>
        <a href="#" className="text-sm text-[var(--color-text-muted)] hover:underline font-bold">Show all</a>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">{children}</div>
    </section>
  )
}

function TileLink({ href, img, title, subtitle, circle }: { href: string; img?: string; title: string; subtitle?: string; circle?: boolean }) {
  const nav = useNavigate()
  return (
    <div onClick={() => nav(href)} className="group relative p-4 rounded-md bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] transition cursor-pointer">
      <div className={`mb-3 aspect-square ${circle ? 'rounded-full' : 'rounded-md'} bg-[var(--color-bg-pressed)] bg-cover bg-center shadow-[0_8px_24px_rgba(0,0,0,0.5)]`} style={{ backgroundImage: img ? `url("${img}")` : undefined }} />
      <div className="text-white font-bold truncate">{title}</div>
      <div className="text-sm text-[var(--color-text-muted)] truncate">{subtitle}</div>
      <span className="absolute right-6 bottom-[88px] w-12 h-12 rounded-full bg-[var(--color-accent)] text-black grid place-items-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition shadow-lg">
        <Icon name="play" className="w-5 h-5" filled />
      </span>
    </div>
  )
}

function PersonalRow({ title, liked, history }: { title: string; liked: any[]; history: any[] }) {
  const setQueue = usePlayer((s) => s.setQueue)
  const shuffleLiked = () => {
    if (!liked.length) return
    const sh = [...liked].sort(() => Math.random() - 0.5)
    setQueue(sh, 0)
  }
  const playRecent = () => {
    if (history.length) setQueue(history, 0)
  }
  return (
    <SectionShell title={title}>
      {liked.length > 0 ? (
        <div onClick={shuffleLiked} className="p-4 rounded-md bg-gradient-to-br from-purple-700 to-pink-600 cursor-pointer hover:scale-[1.02] transition">
          <div className="aspect-square rounded-md grid place-items-end shadow-xl mb-3 bg-cover bg-center" style={{ backgroundImage: liked[0]?.img ? `url("${liked[0].img}")` : undefined }}>
            <div className="text-white text-xl font-extrabold p-3">Your Mix</div>
          </div>
          <div className="text-white font-bold">Liked Songs Mix</div>
          <div className="text-sm text-white/80">From {liked.length} liked songs</div>
        </div>
      ) : (
        <a href="/library" className="p-4 rounded-md bg-gradient-to-br from-purple-700 to-pink-600 hover:scale-[1.02] transition">
          <div className="aspect-square rounded-md grid place-items-center text-white text-2xl font-extrabold shadow-xl mb-3">Start liking</div>
          <div className="text-white font-bold">Liked Songs</div>
          <div className="text-sm text-white/80">Click ♥ on any track</div>
        </a>
      )}
      <a href="/made-for-you" className="p-4 rounded-md bg-gradient-to-br from-blue-700 to-cyan-600 hover:scale-[1.02] transition">
        <div className="aspect-square rounded-md grid place-items-center text-white text-2xl font-extrabold shadow-xl mb-3">Daily Mix</div>
        <div className="text-white font-bold">Daily Mix 1</div>
        <div className="text-sm text-white/80">Based on your taste</div>
      </a>
      <div onClick={playRecent} className="p-4 rounded-md bg-gradient-to-br from-orange-700 to-red-700 cursor-pointer hover:scale-[1.02] transition">
        <div className="aspect-square rounded-md grid place-items-center text-white text-2xl font-extrabold shadow-xl mb-3">Recents</div>
        <div className="text-white font-bold">Pick up where you left off</div>
        <div className="text-sm text-white/80">{history.length} recent plays</div>
      </div>
    </SectionShell>
  )
}

function Section({ title, subtitle, items }: { title: string; subtitle?: string; items: any[] }) {
  const setQueue = usePlayer((s) => s.setQueue)
  return (
    <SectionShell title={title} subtitle={subtitle}>
      {items.map((t: any, i: number) => (
        <div key={`${t.id}-${i}`} onClick={() => setQueue(items, i)} className="group relative p-4 rounded-md bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] transition cursor-pointer">
          <div className="mb-3 aspect-square rounded-md bg-[var(--color-bg-pressed)] bg-cover bg-center shadow-xl" style={{ backgroundImage: t.img ? `url("${t.img}")` : undefined }} />
          <div className="text-white font-bold truncate">{t.title}</div>
          <div className="text-sm text-[var(--color-text-muted)] truncate">{t.artist || ''}</div>
        </div>
      ))}
    </SectionShell>
  )
}
