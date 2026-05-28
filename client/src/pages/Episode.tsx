import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { HeroHeader, ActionBar } from './DetailShared'

export default function Episode() {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['ep', id],
    queryFn: () => api.episode(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-6 text-[var(--color-text-muted)]">Loading…</div>
  if (error)     return <div className="p-6 text-red-400">Failed: {String(error)}</div>
  if (!data)     return null

  return (
    <div>
      <HeroHeader kind="Episode" title={data.title} subtitle={(data as any).subtitle} img={data.img} />
      <ActionBar tracks={[data]} />
      {(data as any).description && (
        <div className="px-6 pb-12 text-[var(--color-text-muted)] max-w-3xl leading-relaxed">{(data as any).description}</div>
      )}
    </div>
  )
}
