import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/authStore'
import { getLocalHistory } from '@/hooks/useHistory'
import { usePlayer } from '@/stores/playerStore'
import type { Track } from '@/types'

export default function Recent() {
  const user = useAuth((s) => s.user)
  const [tracks, setTracks] = useState<Track[]>(getLocalHistory())

  useEffect(() => {
    if (!supabase || !user) { setTracks(getLocalHistory()); return }
    supabase.from('history').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (!data) return
        const map = new Map<string, Track>()
        for (const r of data) {
          if (!map.has(r.track_id)) map.set(r.track_id, { id: r.track_id, title: r.title, artist: r.artist, img: r.img, duration: 0 } as Track)
        }
        setTracks(Array.from(map.values()))
      })
  }, [user])

  if (!tracks.length) {
    return <div className="p-6 text-[var(--color-text-muted)]">No recent plays yet.</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-4xl font-extrabold text-white mb-6">Recently Played</h1>
      <div className="flex flex-col gap-1">
        {tracks.map((t, i) => (
          <button key={`${t.id}-${i}`} onClick={() => usePlayer.getState().setQueue(tracks, i)} className="flex items-center gap-3 p-2 rounded hover:bg-white/10 text-left">
            <div className="w-12 h-12 rounded bg-cover bg-center bg-[var(--color-bg-pressed)]" style={{ backgroundImage: t.img ? `url("${t.img}")` : undefined }} />
            <div>
              <div className="text-white">{t.title}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{t.artist}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
