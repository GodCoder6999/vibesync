import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import MiniPlayer from '@/components/MiniPlayer'
import { usePlayer } from '@/stores/playerStore'

export default function AppLayout() {
  const init = usePlayer((s) => s.init)
  useEffect(() => { init() }, [init])

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 gap-2 p-2 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col rounded-lg bg-[var(--color-bg-panel)] overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <MiniPlayer />
    </div>
  )
}
