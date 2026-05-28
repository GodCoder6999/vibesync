import type { ArtistDetail, AlbumDetail, PlaylistDetail, PodcastDetail, SearchResults, Track } from '@/types'

const BASE = (import.meta.env.VITE_API_BASE as string) || 'https://vibesync-4y9t.onrender.com'

async function get<T>(path: string): Promise<T> {
  const url = BASE + path
  // eslint-disable-next-line no-console
  console.debug('[api] →', url)
  const r = await fetch(url)
  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`${path} → ${r.status} ${body.slice(0, 120)}`)
  }
  const data = (await r.json()) as any
  if (data && data.error) {
    throw new Error(`${path} backend error: ${data.error}`)
  }
  return data as T
}

export const api = {
  // Curated home (Spotify catalogue via SpotAPI)
  home: () => get<{ playlists: any[]; artists: any[] }>('/api/sx-home'),

  // Detail pages
  playlist: (id: string) => get<PlaylistDetail>(`/api/sx-playlist?id=${encodeURIComponent(id)}`),
  album:    (id: string) => get<AlbumDetail>(`/api/sx-album?id=${encodeURIComponent(id)}`),
  artist:   (id: string) => get<ArtistDetail>(`/api/sx-artist?id=${encodeURIComponent(id)}`),
  podcast:  (id: string) => get<PodcastDetail>(`/api/sx-podcast?id=${encodeURIComponent(id)}`),
  episode:  (id: string) => get<Track>(`/api/sx-episode?id=${encodeURIComponent(id)}`),

  // Multi-type Spotify search
  search: (q: string, limit = 8) =>
    get<SearchResults>(`/api/sx-search?q=${encodeURIComponent(q)}&limit=${limit}`),

  // Audio matching: query JioSaavn for a track URL
  matchAudio: (q: string) =>
    get<{ results: Track[] }>(`/api/search?q=${encodeURIComponent(q)}&limit=1`),

  // YouTube Music fallback (if JioSaavn missing a Western track)
  ytSearch: (q: string) =>
    get<{ results: any[] }>(`/api/yt-search?q=${encodeURIComponent(q)}&limit=3`).catch(() => ({ results: [] as any[] })),
  ytStream: (id: string) =>
    get<{ url: string }>(`/api/yt-stream?id=${encodeURIComponent(id)}`).catch(() => ({ url: '' })),

  // Lyrics
  lyrics: (title: string, artist: string) =>
    get<{ plain: string; synced: string; source: string }>(
      `/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
    ),
}
