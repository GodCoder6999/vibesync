import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { playlistsApi } from '@/lib/playlists'
import { useAuth } from '@/stores/authStore'
import { useUi } from '@/stores/uiStore'
import { usePlayer } from '@/stores/playerStore'
import { HeroHeader, ActionBar, TrackTable } from './DetailShared'
import { HeroSkeleton, TrackRowSkeleton } from '@/components/Skeleton'
import { Icon } from '@/components/Icon'

export default function UserPlaylist() {
  const { id } = useParams()
  const user = useAuth((s) => s.user)
  const qc = useQueryClient()
  const nav = useNavigate()
  const toast = useUi((s) => s.toast)
  const [editing, setEditing] = useState(false)

  const meta = useQuery({
    queryKey: ['user-pl-meta', id],
    queryFn: async () => {
      const list = await playlistsApi.list(user!.id)
      return list.find((p) => p.id === id) || null
    },
    enabled: !!user && !!id,
  })
  const tracks = useQuery({
    queryKey: ['user-pl-tracks', id],
    queryFn: () => playlistsApi.tracks(id!),
    enabled: !!id,
  })

  if (!user) return <div className="p-6 text-[var(--color-text-muted)]">Log in to view your playlists.</div>
  if (meta.isLoading || tracks.isLoading) return <div><HeroSkeleton /><TrackRowSkeleton count={5} /></div>
  if (!meta.data)   return <div className="p-6 text-red-400">Playlist not found.</div>

  async function rename() {
    const v = prompt('New title', meta.data!.title)
    if (!v) return
    await playlistsApi.update(meta.data!.id, { title: v })
    qc.invalidateQueries({ queryKey: ['user-pl-meta', id] })
    qc.invalidateQueries({ queryKey: ['my-playlists'] })
  }
  async function remove() {
    if (!confirm(`Delete "${meta.data!.title}"?`)) return
    await playlistsApi.remove(meta.data!.id)
    qc.invalidateQueries({ queryKey: ['my-playlists'] })
    toast('Playlist deleted')
    nav('/')
  }

  return (
    <div>
      <HeroHeader kind="Playlist" title={meta.data.title} subtitle={user.display_name || user.email} img={meta.data.cover_url || ''} count={tracks.data?.length || 0} />
      <div className="px-6 py-4 flex items-center gap-3">
        <button onClick={() => tracks.data?.length && usePlayer.getState().setQueue(tracks.data, 0)} className="w-14 h-14 grid place-items-center rounded-full bg-[var(--color-accent)] text-black hover:scale-105">
          <Icon name="play" className="w-6 h-6" filled />
        </button>
        <button onClick={rename} className="px-3 py-1.5 rounded-full bg-[var(--color-bg-hover)] text-sm text-white">Rename</button>
        <button onClick={remove} className="px-3 py-1.5 rounded-full bg-[var(--color-bg-hover)] text-sm text-[var(--color-danger)]">Delete</button>
      </div>
      <TrackTable tracks={tracks.data || []} showAlbum />
      {(tracks.data?.length || 0) === 0 && (
        <div className="px-6 py-12 text-center text-[var(--color-text-muted)]">
          Empty playlist. Right-click any song → "Add to playlist" to start.
        </div>
      )}
    </div>
  )
}
