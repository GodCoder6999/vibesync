import { supabase } from './supabase'
import type { Track } from '@/types'

export type UserPlaylist = {
  id: string
  owner_id: string
  title: string
  description: string
  cover_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export const playlistsApi = {
  async list(ownerId: string): Promise<UserPlaylist[]> {
    if (!supabase) return []
    const { data } = await supabase.from('playlists').select('*').eq('owner_id', ownerId).order('updated_at', { ascending: false })
    return data || []
  },
  async create(ownerId: string, title = 'My Playlist'): Promise<UserPlaylist | null> {
    if (!supabase) return null
    const { data, error } = await supabase.from('playlists').insert({ owner_id: ownerId, title }).select().single()
    if (error) throw error
    return data
  },
  async update(id: string, patch: Partial<UserPlaylist>): Promise<void> {
    if (!supabase) return
    await supabase.from('playlists').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  },
  async remove(id: string): Promise<void> {
    if (!supabase) return
    await supabase.from('playlists').delete().eq('id', id)
  },
  async tracks(playlistId: string): Promise<Track[]> {
    if (!supabase) return []
    const { data } = await supabase.from('playlist_tracks').select('*').eq('playlist_id', playlistId).order('position')
    return (data || []).map((r: any) => ({
      id: r.track_id, title: r.title, artist: r.artist, album: r.album,
      img: r.img, duration: r.duration,
    }))
  },
  async addTrack(playlistId: string, t: Track): Promise<void> {
    if (!supabase) return
    // Find max position
    const { data: top } = await supabase.from('playlist_tracks').select('position').eq('playlist_id', playlistId).order('position', { ascending: false }).limit(1)
    const nextPos = ((top?.[0] as any)?.position ?? -1) + 1
    await supabase.from('playlist_tracks').insert({
      playlist_id: playlistId, position: nextPos, track_id: t.id,
      title: t.title, artist: t.artist, album: t.album, img: t.img, duration: t.duration,
    })
    await playlistsApi.update(playlistId, {})
  },
  async removeTrack(playlistId: string, position: number): Promise<void> {
    if (!supabase) return
    await supabase.from('playlist_tracks').delete().eq('playlist_id', playlistId).eq('position', position)
    // Resequence to avoid gaps (could be skipped at the cost of sparse positions)
    const { data: rows } = await supabase.from('playlist_tracks').select('position').eq('playlist_id', playlistId).order('position')
    if (rows) {
      const updates = rows.filter((r: any, i: number) => r.position !== i)
      // Best-effort: leave gaps in place rather than risk PK collisions; CRUD UI tolerates gaps
      void updates
    }
  },
}
