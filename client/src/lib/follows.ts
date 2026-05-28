import { supabase } from './supabase'

export type FollowKind = 'artist' | 'user' | 'playlist'

export const followsApi = {
  async list(userId: string, kind?: FollowKind) {
    if (!supabase) return []
    let q = supabase.from('follows').select('*').eq('user_id', userId)
    if (kind) q = q.eq('kind', kind)
    const { data } = await q
    return data || []
  },
  async isFollowing(userId: string, kind: FollowKind, targetId: string) {
    if (!supabase) return false
    const { data } = await supabase.from('follows').select('target_id').eq('user_id', userId).eq('kind', kind).eq('target_id', targetId).maybeSingle()
    return !!data
  },
  async follow(userId: string, kind: FollowKind, targetId: string) {
    if (!supabase) return
    await supabase.from('follows').upsert({ user_id: userId, kind, target_id: targetId })
  },
  async unfollow(userId: string, kind: FollowKind, targetId: string) {
    if (!supabase) return
    await supabase.from('follows').delete().eq('user_id', userId).eq('kind', kind).eq('target_id', targetId)
  },
}
