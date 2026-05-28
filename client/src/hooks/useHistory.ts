import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/authStore'
import { usePlayer } from '@/stores/playerStore'
import type { Track } from '@/types'

/** Record every track-change to localStorage + (if signed in) Supabase
 * history. Local history is always available; cloud history is the
 * source for cross-device Recently Played. */
export function useHistory() {
  const user = useAuth((s) => s.user)
  useEffect(() => {
    let last: string | null = null
    return usePlayer.subscribe((s) => {
      const t = s.current
      if (!t || t.id === last) return
      last = t.id
      pushLocal(t)
      if (supabase && user) {
        supabase.from('history').insert({
          user_id: user.id, track_id: t.id, title: t.title, artist: t.artist, img: t.img,
        }).then(() => {}, () => {})
      }
    })
  }, [user])
}

function pushLocal(t: Track) {
  try {
    const arr: Track[] = JSON.parse(localStorage.getItem('vs-history') || '[]')
    const filtered = arr.filter((x) => x.id !== t.id)
    filtered.unshift(t)
    localStorage.setItem('vs-history', JSON.stringify(filtered.slice(0, 50)))
  } catch {}
}

export function getLocalHistory(): Track[] {
  try { return JSON.parse(localStorage.getItem('vs-history') || '[]') } catch { return [] }
}
