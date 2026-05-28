import { useQuery, useQueries } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Section } from '@/components/Section'
import type { Tile } from '@/types'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const { data, isLoading, error } = useQuery({ queryKey: ['home'], queryFn: api.home })

  const rawPlaylists = (data?.playlists ?? []).slice(0, 6)
  const rawArtists = (data?.artists ?? []).slice(0, 6)

  const plQueries = useQueries({
    queries: rawPlaylists.map((p: any) => ({
      queryKey: ['pl', p.id],
      queryFn: () => api.playlist(p.id),
      staleTime: 60 * 60_000,
    })),
  })
  const arQueries = useQueries({
    queries: rawArtists.map((a: any) => ({
      queryKey: ['ar', a.id],
      queryFn: () => api.artist(a.id),
      staleTime: 60 * 60_000,
    })),
  })

  const playlists: Tile[] = rawPlaylists.map((p: any, i: number) => ({
    ...p,
    img: plQueries[i]?.data?.img || p.img || '',
  }))
  const artists: Tile[] = rawArtists.map((a: any, i: number) => ({
    ...a,
    img: arQueries[i]?.data?.img || a.img || '',
  }))

  return (
    <div className="bg-gradient-to-b from-[#1f1f1f] to-transparent">
      <div className="px-6 pt-2 pb-6">
        <h1 className="text-3xl font-bold text-white">{greeting()}</h1>
      </div>
      {error && (
        <div className="mx-6 mb-4 p-3 rounded bg-red-900/50 text-red-200 text-sm">
          Backend error: {(error as Error)?.message}
        </div>
      )}
      {isLoading && <div className="px-6 text-[var(--color-text-muted)]">Loading…</div>}
      <Section title="Featured Playlists" items={playlists} showAllHref="/search" />
      <Section title="Popular Artists" items={artists} circle showAllHref="/search" />
    </div>
  )
}
