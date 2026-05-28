import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/authStore'
import { followsApi } from '@/lib/follows'
import { useState, useEffect } from 'react'
import { useUi } from '@/stores/uiStore'

export default function Profile() {
  const { id } = useParams()
  const me = useAuth((s) => s.user)
  const toast = useUi((s) => s.toast)
  const isMe = me?.id === id

  const profile = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!supabase || !id) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
      return data
    },
    enabled: !!id,
  })

  const playlists = useQuery({
    queryKey: ['public-playlists', id],
    queryFn: async () => {
      if (!supabase || !id) return []
      const { data } = await supabase.from('playlists').select('*').eq('owner_id', id).eq('is_public', true).order('updated_at', { ascending: false })
      return data || []
    },
    enabled: !!id,
  })

  const [following, setFollowing] = useState(false)
  useEffect(() => {
    if (!me || isMe || !id) return
    followsApi.isFollowing(me.id, 'user', id).then(setFollowing)
  }, [me, id, isMe])

  async function toggleFollow() {
    if (!me || !id) return
    if (following) { await followsApi.unfollow(me.id, 'user', id); setFollowing(false); toast('Unfollowed') }
    else           { await followsApi.follow(me.id, 'user', id);   setFollowing(true);  toast('Following') }
  }

  if (profile.isLoading) return <div className="p-6 text-[var(--color-text-muted)]">Loading…</div>
  if (!profile.data)     return <div className="p-6 text-yellow-400">User not found.</div>

  const name = profile.data.display_name || profile.data.username || 'User'
  const initial = (name[0] || 'U').toUpperCase()

  return (
    <div>
      <div className="flex items-end gap-6 px-6 pt-16 pb-6 bg-gradient-to-b from-[#535353] to-transparent">
        <div className="w-[180px] h-[180px] rounded-full bg-[var(--color-bg-pressed)] bg-cover bg-center shadow-2xl grid place-items-center text-6xl font-extrabold text-white" style={{ backgroundImage: profile.data.avatar_url ? `url("${profile.data.avatar_url}")` : undefined }}>
          {!profile.data.avatar_url && initial}
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-white">Profile</div>
          <h1 className="text-7xl font-extrabold text-white">{name}</h1>
          <div className="text-sm text-[var(--color-text-muted)] mt-3">{playlists.data?.length || 0} public playlist{(playlists.data?.length || 0) === 1 ? '' : 's'}</div>
        </div>
      </div>
      {!isMe && me && (
        <div className="px-6 py-4">
          <button onClick={toggleFollow} className={`px-5 py-2 rounded-full border ${following ? 'border-white/40 text-white' : 'border-white text-white'} font-bold text-sm hover:scale-[1.03]`}>
            {following ? 'Following' : 'Follow'}
          </button>
        </div>
      )}
      <section className="px-6 py-4">
        <h2 className="text-2xl font-bold text-white mb-4">Public playlists</h2>
        {playlists.data?.length === 0 && <div className="text-[var(--color-text-muted)]">No public playlists.</div>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {playlists.data?.map((p: any) => (
            <a key={p.id} href={`/me/playlist/${p.id}`} className="p-4 rounded-md bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]">
              <div className="aspect-square rounded-md bg-cover bg-center bg-[var(--color-bg-pressed)] mb-3" style={{ backgroundImage: p.cover_url ? `url("${p.cover_url}")` : undefined }} />
              <div className="text-white font-bold truncate">{p.title}</div>
              <div className="text-xs text-[var(--color-text-muted)] truncate">{p.description || 'Playlist'}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
