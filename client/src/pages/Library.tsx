import { useLikes } from '@/stores/likesStore'
import { usePlayer } from '@/stores/playerStore'
import { Icon } from '@/components/Icon'

function fmt(s: number) {
  if (!s) return '0:00'
  const m = Math.floor(s / 60), sec = String(Math.floor(s % 60)).padStart(2, '0')
  return `${m}:${sec}`
}

export default function Library() {
  const tracks = useLikes((s) => s.tracks)
  const setQueue = usePlayer((s) => s.setQueue)

  return (
    <div>
      <div className="px-6 pt-16 pb-6 bg-gradient-to-b from-purple-700 to-transparent">
        <div className="text-xs font-bold uppercase text-white">Playlist</div>
        <h1 className="text-7xl font-extrabold text-white">Liked Songs</h1>
        <div className="text-sm text-[var(--color-text-muted)] mt-4">You · {tracks.length} song{tracks.length === 1 ? '' : 's'}</div>
      </div>

      <div className="px-6 py-4 flex items-center gap-6">
        <button onClick={() => tracks.length && setQueue(tracks, 0)} className="w-14 h-14 grid place-items-center rounded-full bg-[var(--color-accent)] text-black hover:scale-105">
          <Icon name="play" className="w-6 h-6" filled />
        </button>
      </div>

      <div className="px-6 pb-12">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-[var(--color-text-muted)]">
            <tr>
              <th className="text-left py-2 pl-4 w-12">#</th>
              <th className="text-left py-2">Title</th>
              <th className="text-left py-2">Album</th>
              <th className="text-right py-2 pr-4">⏱</th>
            </tr>
          </thead>
          <tbody>
            {tracks.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-[var(--color-text-muted)]">No liked songs yet. Click the heart on any track to save it.</td></tr>
            )}
            {tracks.map((t, i) => (
              <tr key={t.id} onClick={() => setQueue(tracks, i)} className="hover:bg-white/10 cursor-pointer">
                <td className="py-2 pl-4 text-[var(--color-text-muted)]">{i + 1}</td>
                <td className="py-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-cover bg-center" style={{ backgroundImage: t.img ? `url("${t.img}")` : undefined }} />
                  <div>
                    <div className="text-white">{t.title}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{t.artist}</div>
                  </div>
                </td>
                <td className="py-2 text-[var(--color-text-muted)]">{t.album || ''}</td>
                <td className="py-2 pr-4 text-right text-[var(--color-text-muted)]">{fmt(t.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
