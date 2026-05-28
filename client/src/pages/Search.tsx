import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Section } from '@/components/Section'
import { TileCard } from '@/components/TileCard'
import { usePlayer } from '@/stores/playerStore'

export default function Search() {
  const { query } = useParams<{ query?: string }>()
  const q = (query || '').trim()
  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.search(q, 8),
    enabled: !!q,
  })
  const setQueue = usePlayer((s) => s.setQueue)

  if (!q) return <BrowsePlaceholder />
  if (isLoading) return <div className="p-6 text-[var(--color-text-muted)]">Searching…</div>
  if (!data || (!data.tracks?.length && !data.albums?.length && !data.artists?.length)) {
    return <div className="p-6 text-white">No results for "{q}"</div>
  }

  const top = data.top_result as any
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 mb-8">
        {top && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Top result</h2>
            <div className="p-5 rounded-lg bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] cursor-pointer">
              <div className="aspect-square w-32 rounded-md bg-cover bg-center mb-4" style={{ backgroundImage: top.img ? `url("${top.img}")` : undefined }} />
              <div className="text-3xl font-bold text-white">{top.title}</div>
              <div className="text-[var(--color-text-muted)] mt-1">{top.artist || top.subtitle}</div>
            </div>
          </section>
        )}
        {!!data.tracks?.length && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Songs</h2>
            <div className="flex flex-col gap-1">
              {data.tracks.slice(0, 4).map((t, i) => (
                <button key={t.id} onClick={() => setQueue(data.tracks, i)} className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-bg-hover)]">
                  <div className="w-10 h-10 rounded bg-cover bg-center" style={{ backgroundImage: t.img ? `url("${t.img}")` : undefined }} />
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-white truncate">{t.title}</div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">{t.artist}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <Section title="Artists" items={data.artists || []} circle />
      <Section title="Albums" items={data.albums || []} />
      <Section title="Playlists" items={data.playlists || []} />
      <Section title="Podcasts & Shows" items={data.podcasts || []} />
    </div>
  )
}

const GENRES = [
  ['Pop', '#8d67ab'], ['Hip-Hop', '#bc5900'], ['Rock', '#e8115b'],
  ['Indie', '#608108'], ['Bollywood', '#dc148c'], ['Punjabi', '#1e3264'],
  ['K-Pop', '#477d95'], ['Electronic', '#503751'], ['Chill', '#1e3264'],
  ['Workout', '#777777'], ['Sleep', '#006450'], ['Classical', '#777777'],
]
function BrowsePlaceholder() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Browse all</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {GENRES.map(([name, color]) => (
          <a key={name} href={`/search/${encodeURIComponent(name)}`} className="aspect-[2/1] rounded-lg p-4 text-white font-bold text-xl overflow-hidden" style={{ background: color }}>
            {name}
          </a>
        ))}
      </div>
    </div>
  )
}
