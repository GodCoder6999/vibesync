import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type RightTab = 'queue' | 'lyrics' | 'now'

type State = {
  rightOpen: boolean
  rightTab: RightTab
  sidebarCollapsed: boolean
  libFilter: 'all' | 'playlists' | 'albums' | 'artists' | 'podcasts'
}

type Actions = {
  toggleRight: (tab?: RightTab) => void
  setRightTab: (tab: RightTab) => void
  toggleSidebar: () => void
  setLibFilter: (f: State['libFilter']) => void
}

export const useUi = create<State & Actions>()(
  persist(
    (set, get) => ({
      rightOpen: false,
      rightTab: 'queue',
      sidebarCollapsed: false,
      libFilter: 'all',
      toggleRight: (tab) => {
        if (tab && get().rightOpen && get().rightTab === tab) set({ rightOpen: false })
        else set({ rightOpen: true, ...(tab ? { rightTab: tab } : {}) })
      },
      setRightTab: (rightTab) => set({ rightTab, rightOpen: true }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setLibFilter: (libFilter) => set({ libFilter }),
    }),
    { name: 'vs-ui' }
  )
)
