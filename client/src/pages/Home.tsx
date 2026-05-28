import { useQuery, useQueries } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Section } from '@/components/Section'
import type { Tile } from '@/types'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const { data, isLoading } = useQuery({ queryKey: ['home'], queryFn: api.home })

  const playlistIds = (data?.playlists ?? []).slice(0, 6).map((p: any) => p.id)
  const artistIds   = (data?.artists ?? []).slice(0, 6).map((a: any) => a.id)

  // Fetch real covers per tile in parallel
  const plQueries = useQueries({
    queries: playlistIds.map((id) => ({
      queryKey: ['pl', id],
      queryFn: () => api.playlist(id),
      staleTime: 60 * 60_000,
    })),
  })
  const arQueries = useQueries({
    queries: artistIds.map((id) => ({
      queryKey: ['ar', id],
      queryFn: () => api.artist(id),
      staleTime: 60 * 60_000,
    })),
  })

  const playlists: Tile[] = (data?.playlists ?? []).map((p: any, i: number) => ({
    ...p,
    img: plQueries[i]?.data?.img || p.img,
  }))
  const artists: Tile[] = (data?.artists ?? []).map((a: any, i: number) => ({
    ...a,
    img: arQueries[i]?.data?.img || a.img,
  }))

  return (
    <div className="bg-gradient-to-b from-[#1f1f1f] to-transparent">
      <div className="px-6 pt-2 pb-6">
        <h1 className="text-3xl font-bold text-white">{greeting()}</h1>
      </div>
      {isLoading && <div className="px-6 text-[var(--color-text-muted)]">Loading…</div>}
      <Section title="Featured Playlists" items={playlists} showAllHref="/search" />
      <Section title="Popular Artists" items={artists} circle showAllHref="/search" />
    </div>
  )
}
