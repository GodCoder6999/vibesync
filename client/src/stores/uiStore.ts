import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type RightTab = 'queue' | 'lyrics' | 'now'

type Toast = { id: number; text: string }

type Menu = {
  x: number
  y: number
  items: { label: string; onClick: () => void; danger?: boolean; divider?: boolean }[]
}

type LibSort = 'recents' | 'recently-added' | 'alphabetical' | 'creator'
type LibView = 'list' | 'compact' | 'grid'

type State = {
  rightOpen: boolean
  rightTab: RightTab
  sidebarCollapsed: boolean
  libFilter: 'all' | 'playlists' | 'albums' | 'artists' | 'podcasts'
  libSort: LibSort
  libView: LibView
  fullscreen: boolean
  toasts: Toast[]
  menu: Menu | null
}

type Actions = {
  toggleRight: (tab?: RightTab) => void
  setRightTab: (tab: RightTab) => void
  toggleSidebar: () => void
  setLibFilter: (f: State['libFilter']) => void
  setLibSort: (s: LibSort) => void
  setLibView: (v: LibView) => void
  toggleFullscreen: () => void
  toast: (text: string) => void
  dismissToast: (id: number) => void
  openMenu: (m: Menu) => void
  closeMenu: () => void
}

let toastId = 0

export const useUi = create<State & Actions>()(
  persist(
    (set, get) => ({
      rightOpen: false,
      rightTab: 'queue',
      sidebarCollapsed: false,
      libFilter: 'all',
      libSort: 'recents',
      libView: 'list',
      fullscreen: false,
      toasts: [],
      menu: null,
      toggleRight: (tab) => {
        if (tab && get().rightOpen && get().rightTab === tab) set({ rightOpen: false })
        else set({ rightOpen: true, ...(tab ? { rightTab: tab } : {}) })
      },
      setRightTab: (rightTab) => set({ rightTab, rightOpen: true }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setLibFilter: (libFilter) => set({ libFilter }),
      setLibSort: (libSort) => set({ libSort }),
      setLibView: (libView) => set({ libView }),
      toggleFullscreen: () => set({ fullscreen: !get().fullscreen }),
      toast: (text) => {
        const id = ++toastId
        set({ toasts: [...get().toasts, { id, text }] })
        setTimeout(() => get().dismissToast(id), 3000)
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
      openMenu: (menu) => set({ menu }),
      closeMenu: () => set({ menu: null }),
    }),
    {
      name: 'vs-ui',
      partialize: (s) => ({
        rightOpen: s.rightOpen,
        rightTab: s.rightTab,
        sidebarCollapsed: s.sidebarCollapsed,
        libFilter: s.libFilter,
        libSort: s.libSort,
        libView: s.libView,
      }) as any,
    }
  )
)
