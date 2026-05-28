import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/authStore'
import { useLikes } from '@/stores/likesStore'

/** When a user is signed in, mirror useLikes <-> Supabase liked_tracks.
 * Pulls server state on login. Pushes local toggles on every change. */
export function useSyncLikes() {
  const user = useAuth((s) => s.user)
  const hydratedFor = useRef<string | null>(null)

  // Pull on login
  useEffect(() => {
    if (!supabase || !user || hydratedFor.current === user.id) return
    hydratedFor.current = user.id
    ;(async () => {
      const { data } = await supabase
        .from('liked_tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })
      if (!data) return
      const tracks = data.map((r: any) => ({
        id: r.track_id, title: r.title, artist: r.artist, album: r.album,
        img: r.img, duration: r.duration,
      }))
      const ids = new Set<string>(tracks.map((t) => t.id))
      useLikes.setState({ tracks, ids })
    })()
  }, [user])

  // Push on local change
  useEffect(() => {
    if (!supabase || !user) return
    const sb = supabase
    let last = useLikes.getState().ids
    return useLikes.subscribe(async (s) => {
      const cur = s.ids
      for (const id of cur) {
        if (!last.has(id)) {
          const t = s.tracks.find((x) => x.id === id)
          if (!t) continue
          await sb.from('liked_tracks').upsert({
            user_id: user.id, track_id: t.id, title: t.title, artist: t.artist,
            album: t.album, img: t.img, duration: t.duration,
          })
        }
      }
      for (const id of last) {
        if (!cur.has(id)) {
          await sb.from('liked_tracks').delete()
            .eq('user_id', user.id).eq('track_id', id)
        }
      }
      last = cur
    })
  }, [user])
}
