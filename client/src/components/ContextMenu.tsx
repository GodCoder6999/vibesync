import { useEffect, useRef } from 'react'
import { useUi } from '@/stores/uiStore'

export default function ContextMenu() {
  const menu = useUi((s) => s.menu)
  const close = useUi((s) => s.closeMenu)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    if (menu) {
      document.addEventListener('mousedown', onDown)
      document.addEventListener('keydown', onKey)
    }
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu, close])

  if (!menu) return null

  // Clamp position to viewport
  const vw = window.innerWidth, vh = window.innerHeight
  const W = 240, H = menu.items.length * 36 + 12
  const x = Math.min(menu.x, vw - W - 8)
  const y = Math.min(menu.y, vh - H - 8)

  return (
    <div
      ref={ref}
      style={{ left: x, top: y, width: W }}
      className="fixed z-[100] py-1.5 rounded-md bg-[#282828] text-white shadow-2xl ring-1 ring-white/5"
    >
      {menu.items.map((it, i) => (
        <div key={i}>
          {it.divider && <div className="my-1 h-px bg-white/10" />}
          <button
            onClick={() => { it.onClick(); close() }}
            className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10 ${it.danger ? 'text-[var(--color-danger)]' : ''}`}
          >
            {it.label}
          </button>
        </div>
      ))}
    </div>
  )
}
