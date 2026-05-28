import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

type User = { id: string; email: string; display_name?: string; avatar_url?: string }

type State = {
  user: User | null
  loading: boolean
}

type Actions = {
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, display_name?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

export const useAuth = create<State & Actions>((set) => ({
  user: null,
  loading: true,
  init: async () => {
    if (!supabase) { set({ loading: false }); return }
    const { data } = await supabase.auth.getUser()
    set({ user: data.user ? toUser(data.user) : null, loading: false })
    supabase.auth.onAuthStateChange((_, session) => {
      set({ user: session?.user ? toUser(session.user) : null })
    })
  },
  signIn: async (email, password) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  },
  signUp: async (email, password, display_name) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: display_name ? { display_name } : undefined },
    })
    return { error: error?.message }
  },
  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  },
}))

function toUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    display_name: u.user_metadata?.display_name,
    avatar_url: u.user_metadata?.avatar_url,
  }
}
