export function CardSkeleton({ circle }: { circle?: boolean }) {
  return (
    <div className="p-4 rounded-md bg-[var(--color-bg-elevated)]">
      <div className={`mb-3 aspect-square ${circle ? 'rounded-full' : 'rounded-md'} bg-white/5 animate-pulse`} />
      <div className="h-4 w-3/4 bg-white/10 rounded mb-2 animate-pulse" />
      <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
    </div>
  )
}

export function SectionSkeleton({ title, circle }: { title: string; circle?: boolean }) {
  return (
    <section className="px-6 pb-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} circle={circle} />)}
      </div>
    </section>
  )
}

export function HeroSkeleton() {
  return (
    <div className="flex items-end gap-6 px-6 pt-16 pb-6 bg-gradient-to-b from-[#333] to-transparent">
      <div className="w-[232px] h-[232px] bg-white/5 animate-pulse" />
      <div className="flex-1">
        <div className="h-3 w-16 bg-white/10 rounded mb-3 animate-pulse" />
        <div className="h-14 w-2/3 bg-white/15 rounded mb-4 animate-pulse" />
        <div className="h-4 w-1/3 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
  )
}

export function TrackRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="px-6 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="w-6 text-center text-[var(--color-text-muted)] text-sm">{i + 1}</div>
          <div className="w-10 h-10 rounded bg-white/5 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-1/3 bg-white/10 rounded mb-2 animate-pulse" />
            <div className="h-3 w-1/4 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
