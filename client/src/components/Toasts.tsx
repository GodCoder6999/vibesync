import { useUi } from '@/stores/uiStore'

export default function Toasts() {
  const toasts = useUi((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-[110px] left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="px-4 py-3 rounded-md bg-[var(--color-accent)] text-black font-bold text-sm shadow-2xl animate-[fadeIn_0.2s]">
          {t.text}
        </div>
      ))}
    </div>
  )
}
