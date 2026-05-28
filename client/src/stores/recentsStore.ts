import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track, Tile } from '@/types'

type RecentItem =
  | ({ kind: 'track' } & Track)
  | ({ kind: 'tile'  } & Tile)
  | ({ kind: 'query'; q: string })

type State = { items: RecentItem[] }
type Actions = { push: (item: RecentItem) => void; clear: () => void }

const KEY = (it: RecentItem) => it.kind === 'query' ? `q:${it.q}` : `${it.kind}:${it.id}`

export const useRecents = create<State & Actions>()(
  persist(
    (set, get) => ({
      items: [],
      push: (item) => {
        const k = KEY(item)
        const filtered = get().items.filter((x) => KEY(x) !== k)
        set({ items: [item, ...filtered].slice(0, 12) })
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'vs-recents' }
  )
)
