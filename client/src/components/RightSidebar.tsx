import { useQuery } from '@tanstack/react-query'
import { usePlayer } from '@/stores/playerStore'
import { useLikes } from '@/stores/likesStore'
import { useUi } from '@/stores/uiStore'
import { api } from '@/lib/api'
import { Icon } from './Icon'

export default function RightSidebar() {
  const { rightOpen, rightTab, setRightTab, toggleRight, toggleFullscreen, toast } = useUi()
  const current = usePlayer((s) => s.current)
  const liked = useLikes((s) => current ? s.isLiked(current.id) : false)
  const toggleLike = useLikes((s) => s.toggle)
  if (!rightOpen) return null

  return (
    <aside aria-label="Now playing view" className="w-[360px] flex flex-col rounded-lg bg-[var(--color-bg-panel)] overflow-hidden">
      <header className="flex items-center gap-2 p-3 border-b border-white/5">
        <h2 className="text-white font-bold text-sm flex-1 truncate">{current?.title || 'Now Playing'}</h2>
        <button onClick={toggleFullscreen} aria-label="Expand Now Playing view" title="Expand Now Playing view" className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2v4h1.5V3.5H6V2H2zm12 0h-4v1.5h2.5V6H14V2zM2 14h4v-1.5H3.5V10H2v4zm12 0v-4h-1.5v2.5H10V14h4z"/></svg>
        </button>
        <button onClick={() => toggleRight()} aria-label="Hide Now Playing view" title="Hide Now Playing view" className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white text-lg">×</button>
      </header>

      <nav className="flex gap-1 px-3 py-2 border-b border-white/5">
        <Tab id="now"    label="Now Playing" active={rightTab === 'now'}    onClick={() => setRightTab('now')} />
        <Tab id="queue"  label="Queue"       active={rightTab === 'queue'}  onClick={() => setRightTab('queue')} />
        <Tab id="lyrics" label="Lyrics"      active={rightTab === 'lyrics'} onClick={() => setRightTab('lyrics')} />
      </nav>

      <div className="flex-1 overflow-y-auto">
        {rightTab === 'now'    && <NowPlaying liked={liked} onToggleLike={() => { if (current) { toggleLike(current); toast(liked ? 'Removed' : 'Saved') } }} />}
        {rightTab === 'queue'  && <Queue />}
        {rightTab === 'lyrics' && <Lyrics />}
      </div>
    </aside>
  )
}

function Tab({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button data-tab={id} onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-bold ${active ? 'bg-white text-black' : 'text-[var(--color-text-muted)] hover:text-white'}`}>
      {label}
    </button>
  )
}

function NowPlaying({ liked, onToggleLike }: { liked: boolean; onToggleLike: () => void }) {
  const current = usePlayer((s) => s.current)
  if (!current) return <Empty label="Nothing playing" />
  return (
    <div className="p-4">
      <div className="w-full aspect-square rounded-md bg-cover bg-center bg-[var(--color-bg-pressed)] shadow-2xl" style={{ backgroundImage: current.img ? `url("${current.img}")` : undefined }} />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xl font-bold text-white truncate">{current.title}</div>
          <div className="text-sm text-[var(--color-text-muted)] truncate">{current.artist}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button title="Share" className="text-[var(--color-text-muted)] hover:text-white" onClick={() => { navigator.clipboard.writeText(location.href) }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M11 3.5a2.5 2.5 0 0 1 2.5-2.5 2.5 2.5 0 1 1-1.86 4.17L6.51 8.31a2.49 2.49 0 0 1 0 -.62l5.13-2.86A2.5 2.5 0 0 1 11 3.5zm-7 5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zm9 6a2.5 2.5 0 1 1-1.86-4.17L6.01 7.47a2.49 2.49 0 0 1 0 .56l5.13 2.86A2.5 2.5 0 0 1 13 14.5z"/></svg>
          </button>
          <button onClick={onToggleLike} className={liked ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-white'} title="Save">
            <Icon name="heart" className="w-5 h-5" filled={liked} />
          </button>
        </div>
      </div>

      {current.album && (
        <section className="mt-6 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-[var(--color-bg-elevated)] text-xs font-bold uppercase text-[var(--color-text-muted)]">From the album</div>
          <div className="px-4 py-3 bg-[var(--color-bg-elevated)]">
            <div className="text-white">{current.album}</div>
          </div>
        </section>
      )}

      <AboutTheArtist artist={current.artist} />
    </div>
  )
}

function AboutTheArtist({ artist }: { artist: string }) {
  const { data } = useQuery({
    queryKey: ['search-artist', artist],
    queryFn: () => api.search(artist, 1),
    enabled: !!artist,
    staleTime: 60 * 60_000,
  })
  const a: any = (data?.artists || [])[0]
  if (!a) return null
  return (
    <section className="mt-6 rounded-lg overflow-hidden bg-[var(--color-bg-elevated)]">
      <div className="px-4 py-3 text-xs font-bold uppercase text-[var(--color-text-muted)]">About the artist</div>
      <div className="h-40 bg-cover bg-center" style={{ backgroundImage: a.img ? `url("${a.img}")` : undefined }} />
      <div className="p-4">
        <a href={`/artist/${a.id}`} className="text-white font-bold hover:underline">{a.title}</a>
      </div>
    </section>
  )
}

function Queue() {
  const { queue, index, _loadIndex } = usePlayer()
  if (!queue.length) return <Empty label="Queue is empty" />
  return (
    <div className="p-3">
      <h3 className="text-sm text-[var(--color-text-muted)] px-3 py-2 font-bold">Now playing</h3>
      <Row track={queue[index]} active onClick={() => {}} />
      {queue.length > index + 1 && (
        <>
          <h3 className="text-sm text-[var(--color-text-muted)] px-3 py-2 font-bold mt-4">Next up</h3>
          {queue.slice(index + 1).map((t, i) => (
            <Row key={`${t.id}-${i}`} track={t} onClick={() => _loadIndex(index + 1 + i)} />
          ))}
        </>
      )}
    </div>
  )
}

function Row({ track, active, onClick }: { track: any; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-2 rounded hover:bg-[var(--color-bg-hover)] text-left ${active ? 'text-[var(--color-accent)]' : 'text-white'}`}>
      <div className="w-10 h-10 rounded bg-cover bg-center bg-[var(--color-bg-pressed)]" style={{ backgroundImage: track?.img ? `url("${track.img}")` : undefined }} />
      <div className="min-w-0 flex-1">
        <div className="truncate">{track?.title}</div>
        <div className="text-xs text-[var(--color-text-muted)] truncate">{track?.artist}</div>
      </div>
    </button>
  )
}

function Lyrics() {
  const current = usePlayer((s) => s.current)
  const { data, isLoading } = useQuery({
    queryKey: ['lyrics', current?.title, current?.artist],
    queryFn: () => api.lyrics(current!.title, current!.artist),
    enabled: !!current?.title && !!current?.artist,
  })
  if (!current) return <Empty label="Nothing playing" />
  if (isLoading) return <Empty label="Fetching lyrics…" />
  const text = data?.plain || ''
  if (!text) return <Empty label="No lyrics found" />
  return <div className="p-6 text-white text-xl leading-loose whitespace-pre-wrap">{text}</div>
}

function Empty({ label }: { label: string }) {
  return <div className="p-6 text-[var(--color-text-muted)] text-sm">{label}</div>
}
