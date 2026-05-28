import { useParams } from 'react-router-dom'

export default function Genre() {
  const { slug } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-white capitalize">{slug}</h1>
      <p className="mt-4 text-[var(--color-text-muted)]">Genre hub coming in Phase 7.</p>
    </div>
  )
}
