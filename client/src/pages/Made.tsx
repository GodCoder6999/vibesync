import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useLikes } from '@/stores/likesStore'
import { usePlayer } from '@/stores/playerStore'
import { getLocalHistory } from '@/hooks/useHistory'
import { api } from '@/lib/api'
import { Icon } from '@/components/Icon'
import { useDominantColor } from '@/hooks/useDominantColor'

export default function Made() {
  const liked = useLikes((s) => s.tracks)
  const history = getLocalHistory()

  return (
    <div className="p-6">
      <h1 className="text-4xl font-extrabold text-white mb-2">Made for You</h1>
      <p className="text-[var(--color-text-muted)] mb-8">Mixes built from what you play and like.</p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        <DailyMixCard
          title="Daily Mix 1"
          subtitle="Shuffled from your Liked Songs"
          seed={liked.slice(0, 16)}
        />
        <DailyMixCard
          title="Daily Mix 2"
          subtitle="Recently played, shuffled"
          seed={history.slice(0, 16)}
        />
        <ReleaseRadar />
      </div>
    </div>
  )
}

function DailyMixCard({ title, subtitle, seed }: { title: string; subtitle: string; seed: any[] }) {
  const cover = seed[0]?.img
  const color = useDominantColor(cover)
  const play = () => {
    if (!seed.length) return
    const shuffled = [...seed].sort(() => Math.random() - 0.5)
    usePlayer.getState().setQueue(shuffled, 0)
  }
  return (
    <button onClick={play} className="text-left p-4 rounded-lg hover:bg-white/5 group" style={{ background: `linear-gradient(180deg, ${color}, transparent 80%)` }}>
      <div className="aspect-square rounded-md bg-cover bg-center bg-[var(--color-bg-pressed)] shadow-xl mb-3" style={{ backgroundImage: cover ? `url("${cover}")` : undefined }}>
        <div className="w-full h-full grid place-items-center text-white text-3xl font-extrabold opacity-70">{title.split(' ').pop()}</div>
      </div>
      <div className="text-white font-bold">{title}</div>
      <div className="text-sm text-[var(--color-text-muted)]">{subtitle}</div>
    </button>
  )
}

function ReleaseRadar() {
  // Pull latest tracks from a top curated playlist as a stand-in for "new releases for you"
  const { data } = useQuery({
    queryKey: ['pl', '37i9dQZF1DXcBWIGoYBM5M'],
    queryFn: () => api.playlist('37i9dQZF1DXcBWIGoYBM5M'),
  })
  const nav = useNavigate()
  if (!data) return null
  return (
    <button onClick={() => nav('/playlist/37i9dQZF1DXcBWIGoYBM5M')} className="text-left p-4 rounded-lg hover:bg-white/5">
      <div className="aspect-square rounded-md bg-cover bg-center bg-[var(--color-bg-pressed)] shadow-xl mb-3" style={{ backgroundImage: data.img ? `url("${data.img}")` : undefined }} />
      <div className="text-white font-bold">Release Radar</div>
      <div className="text-sm text-[var(--color-text-muted)]">Today's freshest hits, curated</div>
    </button>
  )
}
