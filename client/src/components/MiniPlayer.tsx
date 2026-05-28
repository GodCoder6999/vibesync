import { usePlayer } from '@/stores/playerStore'
import { useLikes } from '@/stores/likesStore'
import { useUi } from '@/stores/uiStore'
import { Icon } from './Icon'

function RightToggle() {
  const { toggleRight, rightOpen, rightTab } = useUi()
  const cls = (active: boolean) =>
    active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-white'
  return (
    <>
      <button onClick={() => toggleRight('lyrics')} className={cls(rightOpen && rightTab === 'lyrics')} title="Lyrics">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.426 2.574a2.831 2.831 0 0 0-4.797 1.55l3.247 3.247a2.831 2.831 0 0 0 1.55-4.797zM10.5 8.118l-2.619-2.62A63303.13 63303.13 0 0 0 4.74 9.075L2.065 12.12a1.287 1.287 0 0 0 1.816 1.816l3.06-2.688 3.56-3.129zM7.12 4.094a4.331 4.331 0 1 1 4.786 4.786l-3.974 3.493-3.06 2.689a2.787 2.787 0 0 1-3.933-3.933l2.676-3.045 3.505-3.99z"/></svg>
      </button>
      <button onClick={() => toggleRight('queue')} className={cls(rightOpen && rightTab === 'queue')} title="Queue">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-7A2.5 2.5 0 0 1 3.5 1h9a2.5 2.5 0 0 1 0 5h-9A2.5 2.5 0 0 1 1 3.5z"/></svg>
      </button>
    </>
  )
}

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${sec}`
}

export default function MiniPlayer() {
  const { current, isPlaying, toggle, next, prev, position, duration, volume, muted, shuffle, repeat, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat } =
    usePlayer()
  const liked = useLikes((s) => (current ? s.isLiked(current.id) : false))
  const toggleLike = useLikes((s) => s.toggle)

  return (
    <footer className="h-[90px] grid grid-cols-[30%_40%_30%] items-center px-4 bg-black border-t border-white/5">
      <div className="flex items-center gap-3 min-w-0">
        {current ? (
          <>
            <div className="w-14 h-14 rounded bg-[var(--color-bg-elevated)] bg-cover bg-center" style={{ backgroundImage: current.img ? `url("${current.img}")` : undefined }} />
            <div className="min-w-0">
              <div className="text-white text-sm truncate">{current.title}</div>
              <div className="text-xs text-[var(--color-text-muted)] truncate">{current.artist}</div>
            </div>
            <button onClick={() => toggleLike(current)} className={`ml-2 ${liked ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-white'}`} title="Save">
              <Icon name="heart" className="w-5 h-5" filled={liked} />
            </button>
          </>
        ) : (
          <span className="text-[var(--color-text-muted)] text-sm">Pick a song</span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button onClick={toggleShuffle} className={shuffle ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-white'} title="Shuffle">
            <Icon name="shuffle" className="w-4 h-4" filled />
          </button>
          <button onClick={prev} className="text-[var(--color-text-muted)] hover:text-white" title="Previous">
            <Icon name="prev" className="w-4 h-4" filled />
          </button>
          <button onClick={toggle} className="w-9 h-9 grid place-items-center rounded-full bg-white text-black hover:scale-105" title="Play/Pause">
            <Icon name={isPlaying ? 'pause' : 'play'} className="w-4 h-4" filled />
          </button>
          <button onClick={next} className="text-[var(--color-text-muted)] hover:text-white" title="Next">
            <Icon name="next" className="w-4 h-4" filled />
          </button>
          <button onClick={cycleRepeat} className={repeat !== 'off' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-white'} title={`Repeat: ${repeat}`}>
            <Icon name="repeat" className="w-4 h-4" filled />
          </button>
        </div>
        <div className="w-full flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>{fmt(position)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={position}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 accent-white h-1"
          />
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <RightToggle />
        <button onClick={toggleMute} className="text-[var(--color-text-muted)] hover:text-white">
          <Icon name="volume" className="w-5 h-5" filled />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24 accent-white h-1"
        />
      </div>
    </footer>
  )
}
