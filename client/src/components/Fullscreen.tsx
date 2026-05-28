import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePlayer } from '@/stores/playerStore'
import { useUi } from '@/stores/uiStore'
import { useDominantColor } from '@/hooks/useDominantColor'
import { api } from '@/lib/api'
import { Icon } from './Icon'

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60); const sec = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${sec}`
}

export default function Fullscreen() {
  const fullscreen = useUi((s) => s.fullscreen)
  const toggleFs = useUi((s) => s.toggleFullscreen)
  const { current, isPlaying, position, duration, toggle, next, prev, seek } = usePlayer()
  const color = useDominantColor(current?.img)

  const { data: lyrics } = useQuery({
    queryKey: ['lyrics', current?.title, current?.artist],
    queryFn: () => api.lyrics(current!.title, current!.artist),
    enabled: fullscreen && !!current?.title && !!current?.artist,
  })

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggleFs() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, toggleFs])

  if (!fullscreen || !current) return null

  return (
    <div
      className="fixed inset-0 z-[90] grid grid-cols-1 md:grid-cols-2 transition-colors duration-500"
      style={{ background: `linear-gradient(135deg, ${color} 0%, #000 80%)` }}
    >
      <button onClick={toggleFs} title="Close" className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white grid place-items-center">×</button>

      <div className="flex flex-col items-center justify-center p-12 gap-6">
        <div className="w-[min(60vh,500px)] aspect-square rounded-md bg-cover bg-center shadow-2xl" style={{ backgroundImage: current.img ? `url("${current.img}")` : undefined }} />
        <div className="text-center max-w-md">
          <div className="text-3xl font-extrabold text-white">{current.title}</div>
          <div className="text-lg text-white/80 mt-1">{current.artist}</div>
        </div>
        <div className="w-full max-w-md flex items-center gap-3 text-sm text-white/70">
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
        <div className="flex items-center gap-6">
          <button onClick={prev} className="text-white/70 hover:text-white">
            <Icon name="prev" className="w-6 h-6" filled />
          </button>
          <button onClick={toggle} className="w-14 h-14 grid place-items-center rounded-full bg-white text-black hover:scale-105">
            <Icon name={isPlaying ? 'pause' : 'play'} className="w-6 h-6" filled />
          </button>
          <button onClick={next} className="text-white/70 hover:text-white">
            <Icon name="next" className="w-6 h-6" filled />
          </button>
        </div>
      </div>

      <div className="hidden md:block p-12 overflow-y-auto">
        <h2 className="text-white text-2xl font-bold mb-6">Lyrics</h2>
        {lyrics?.plain ? (
          <div className="text-white/90 text-2xl leading-loose whitespace-pre-wrap">{lyrics.plain}</div>
        ) : (
          <div className="text-white/50 text-lg">No lyrics found.</div>
        )}
      </div>
    </div>
  )
}
