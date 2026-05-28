import type { Track } from '@/types'
import { usePlayer } from '@/stores/playerStore'
import { Icon } from '@/components/Icon'
import { useDominantColor } from '@/hooks/useDominantColor'

function fmt(s: number) {
  if (!s) return '0:00'
  const m = Math.floor(s / 60), sec = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${sec}`
}

export function HeroHeader({ kind, title, subtitle, img, count, totalSec }: {
  kind: string; title: string; subtitle?: string; img?: string;
  count?: number; totalSec?: number
}) {
  const color = useDominantColor(img)
  return (
    <div
      className="flex items-end gap-6 px-6 pt-16 pb-6 transition-colors duration-500"
      style={{ background: `linear-gradient(to bottom, ${color} 0%, transparent 100%)` }}
    >
      <div className="w-[232px] h-[232px] bg-[var(--color-bg-pressed)] bg-cover bg-center shadow-2xl" style={{ backgroundImage: img ? `url("${img}")` : undefined }} />
      <div>
        <div className="text-xs font-bold uppercase text-white">{kind}</div>
        <h1 className="text-6xl font-extrabold text-white">{title}</h1>
        <div className="text-sm text-white mt-3">
          {subtitle && <strong>{subtitle}</strong>}
          {!!count && <span className="text-[var(--color-text-muted)]"> • {count} song{count === 1 ? '' : 's'}</span>}
          {!!totalSec && <span className="text-[var(--color-text-muted)]"> • {Math.floor(totalSec / 60)} min</span>}
        </div>
      </div>
    </div>
  )
}

export function ActionBar({ tracks }: { tracks: Track[] }) {
  const setQueue = usePlayer((s) => s.setQueue)
  return (
    <div className="px-6 py-4 flex items-center gap-6">
      <button onClick={() => tracks.length && setQueue(tracks, 0)} className="w-14 h-14 grid place-items-center rounded-full bg-[var(--color-accent)] text-black hover:scale-105">
        <Icon name="play" className="w-6 h-6" filled />
      </button>
    </div>
  )
}

export function TrackTable({ tracks, showAlbum }: { tracks: Track[]; showAlbum?: boolean }) {
  const setQueue = usePlayer((s) => s.setQueue)
  return (
    <table className="w-full text-sm px-6">
      <thead className="border-b border-white/10 text-[var(--color-text-muted)]">
        <tr>
          <th className="text-left py-2 pl-4 w-12">#</th>
          <th className="text-left py-2">Title</th>
          {showAlbum && <th className="text-left py-2">Album</th>}
          <th className="text-right py-2 pr-4">⏱</th>
        </tr>
      </thead>
      <tbody>
        {tracks.map((t, i) => (
          <tr key={`${t.id}-${i}`} onClick={() => setQueue(tracks, i)} className="hover:bg-white/10 cursor-pointer">
            <td className="py-2 pl-4 text-[var(--color-text-muted)]">{i + 1}</td>
            <td className="py-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-cover bg-center" style={{ backgroundImage: t.img ? `url("${t.img}")` : undefined }} />
              <div>
                <div className="text-white">{t.title}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{t.artist}</div>
              </div>
            </td>
            {showAlbum && <td className="py-2 text-[var(--color-text-muted)]">{t.album || ''}</td>}
            <td className="py-2 pr-4 text-right text-[var(--color-text-muted)]">{fmt(t.duration)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
