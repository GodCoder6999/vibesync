import { useEffect, useRef, useState } from 'react'
import type { Track } from '@/types'
import { usePlayer } from '@/stores/playerStore'
import { Icon } from './Icon'

/** Sticky header bar that fades in once the page scrolls past a
 * threshold. Sits at the top of the scroll viewport (relies on
 * AppLayout's .main-scroll wrapper for the scroll source). */
export function StickyTitle({ title, tracks, color }: { title: string; tracks: Track[]; color?: string }) {
  const [shown, setShown] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const setQueue = usePlayer((s) => s.setQueue)

  useEffect(() => {
    const scroller = sentinelRef.current?.closest('.main-scroll') as HTMLElement | null
    if (!scroller) return
    const onScroll = () => setShown(scroller.scrollTop > 240)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={sentinelRef}
      className={`sticky top-0 z-30 h-[64px] flex items-center gap-4 px-6 transition-opacity ${shown ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ background: color || '#535353' }}
    >
      <button
        onClick={() => tracks.length && setQueue(tracks, 0)}
        className="w-10 h-10 grid place-items-center rounded-full bg-[var(--color-accent)] text-black hover:scale-105"
        title="Play"
      >
        <Icon name="play" className="w-4 h-4" filled />
      </button>
      <h2 className="text-2xl font-bold text-white truncate">{title}</h2>
    </div>
  )
}
