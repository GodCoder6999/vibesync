import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '@/types'

type State = {
  ids: Set<string>
  tracks: Track[]
}

type Actions = {
  isLiked: (id: string) => boolean
  toggle: (t: Track) => void
}

export const useLikes = create<State & Actions>()(
  persist(
    (set, get) => ({
      ids: new Set<string>(),
      tracks: [],
      isLiked: (id) => get().ids.has(id),
      toggle: (t) => {
        const ids = new Set(get().ids)
        let tracks = [...get().tracks]
        if (ids.has(t.id)) {
          ids.delete(t.id)
          tracks = tracks.filter((x) => x.id !== t.id)
        } else {
          ids.add(t.id)
          tracks = [t, ...tracks]
        }
        set({ ids, tracks })
      },
    }),
    {
      name: 'vs-likes',
      partialize: (s) => ({ ids: Array.from(s.ids), tracks: s.tracks }) as any,
      merge: (persisted: any, current) => ({
        ...current,
        tracks: persisted?.tracks ?? [],
        ids: new Set<string>(persisted?.ids ?? []),
      }),
    }
  )
)
