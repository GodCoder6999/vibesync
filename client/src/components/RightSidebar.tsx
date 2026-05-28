import { useQuery } from '@tanstack/react-query'
import { usePlayer } from '@/stores/playerStore'
import { useUi } from '@/stores/uiStore'
import { api } from '@/lib/api'
import { Icon } from './Icon'

export default function RightSidebar() {
  const { rightOpen, rightTab, setRightTab, toggleRight } = useUi()
  if (!rightOpen) return null

  return (
    <aside className="w-[360px] flex flex-col rounded-lg bg-[var(--color-bg-panel)] overflow-hidden">
      <header className="flex items-center gap-1 p-3 border-b border-white/5">
        <Tab id="now"    label="Now Playing" active={rightTab === 'now'}    onClick={() => setRightTab('now')} />
        <Tab id="queue"  label="Queue"       active={rightTab === 'queue'}  onClick={() => setRightTab('queue')} />
        <Tab id="lyrics" label="Lyrics"      active={rightTab === 'lyrics'} onClick={() => setRightTab('lyrics')} />
        <button onClick={() => toggleRight()} className="ml-auto w-7 h-7 grid place-items-center text-[var(--color-text-muted)] hover:text-white" title="Close">×</button>
      </header>
      <div className="flex-1 overflow-y-auto">
        {rightTab === 'now'    && <NowPlaying />}
        {rightTab === 'queue'  && <Queue />}
        {rightTab === 'lyrics' && <Lyrics />}
      </div>
    </aside>
  )
}

function Tab({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      data-tab={id}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold ${active ? 'bg-white text-black' : 'text-[var(--color-text-muted)] hover:text-white'}`}
    >
      {label}
    </button>
  )
}

function NowPlaying() {
  const current = usePlayer((s) => s.current)
  if (!current) return <Empty label="Nothing playing" />
  return (
    <div className="p-4">
      <div className="w-full aspect-square rounded-md bg-cover bg-center bg-[var(--color-bg-pressed)] shadow-2xl" style={{ backgroundImage: current.img ? `url("${current.img}")` : undefined }} />
      <div className="mt-4">
        <div className="text-xl font-bold text-white">{current.title}</div>
        <div className="text-sm text-[var(--color-text-muted)]">{current.artist}</div>
      </div>
      {current.album && (
        <section className="mt-6 p-4 rounded-lg bg-[var(--color-bg-elevated)]">
          <div className="text-xs font-bold uppercase text-[var(--color-text-muted)] mb-2">From the album</div>
          <div className="text-white">{current.album}</div>
        </section>
      )}
    </div>
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
  return (
    <div className="p-6 text-white text-xl leading-loose whitespace-pre-wrap">
      {text}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <div className="p-6 text-[var(--color-text-muted)] text-sm">{label}</div>
}
