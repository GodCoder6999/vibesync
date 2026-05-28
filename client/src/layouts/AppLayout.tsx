import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import MiniPlayer from '@/components/MiniPlayer'
import RightSidebar from '@/components/RightSidebar'
import Fullscreen from '@/components/Fullscreen'
import Toasts from '@/components/Toasts'
import ContextMenu from '@/components/ContextMenu'
import { usePlayer } from '@/stores/playerStore'
import { useAuth } from '@/stores/authStore'
import { useShortcuts } from '@/hooks/useShortcuts'
import { useSyncLikes } from '@/hooks/useSyncLikes'

export default function AppLayout() {
  const init = usePlayer((s) => s.init)
  const initAuth = useAuth((s) => s.init)
  useEffect(() => { init(); initAuth() }, [init, initAuth])
  useShortcuts()
  useSyncLikes()

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 gap-2 p-2 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col rounded-lg bg-[var(--color-bg-panel)] overflow-hidden relative">
          <Topbar />
          <div className="main-scroll flex-1 overflow-y-auto relative">
            <Outlet />
          </div>
        </main>
        <RightSidebar />
      </div>
      <MiniPlayer />
      <Fullscreen />
      <Toasts />
      <ContextMenu />
    </div>
  )
}
