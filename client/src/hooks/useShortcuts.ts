import { useEffect } from 'react'
import { usePlayer } from '@/stores/playerStore'
import { useLikes } from '@/stores/likesStore'
import { useUi } from '@/stores/uiStore'

/** Global keyboard shortcuts. Only fires when the user is not
 * focused in a text input. */
export function useShortcuts() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target?.matches('input, textarea, [contenteditable]')) return

      const p = usePlayer.getState()
      const u = useUi.getState()
      const l = useLikes.getState()

      if (e.code === 'Space') { e.preventDefault(); p.toggle(); return }
      if (e.key === 'ArrowRight' && e.shiftKey) { p.next(); return }
      if (e.key === 'ArrowLeft' && e.shiftKey) { p.prev(); return }
      if (e.key === 'ArrowUp' && e.ctrlKey)  { p.setVolume(Math.min(1, p.volume + 0.05)); return }
      if (e.key === 'ArrowDown' && e.ctrlKey){ p.setVolume(Math.max(0, p.volume - 0.05)); return }
      if (e.key.toLowerCase() === 'm')       { p.toggleMute(); return }
      if (e.key.toLowerCase() === 'l' && p.current) {
        l.toggle(p.current); u.toast(l.isLiked(p.current.id) ? 'Removed from Liked Songs' : 'Saved to Liked Songs')
        return
      }
      if (e.key.toLowerCase() === 'f') { u.toggleFullscreen(); return }
      if (e.key.toLowerCase() === 's') { p.toggleShuffle(); return }
      if (e.key.toLowerCase() === 'r') { p.cycleRepeat(); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
