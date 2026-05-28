import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '@/types'
import { api } from '@/lib/api'

type Repeat = 'off' | 'all' | 'one'

// Module-level (non-reactive) crossfade + sleep state.
let _crossfadeSec = Number(localStorage.getItem('vs-crossfade') || 0)
let _sleepTimer: ReturnType<typeof setTimeout> | null = null

type State = {
  queue: Track[]
  index: number
  current: Track | null
  isPlaying: boolean
  position: number   // seconds
  duration: number   // seconds
  volume: number     // 0..1
  muted: boolean
  shuffle: boolean
  repeat: Repeat
  audio: HTMLAudioElement | null
}

type Actions = {
  init: () => void
  setQueue: (tracks: Track[], startAt?: number) => Promise<void>
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => Promise<void>
  prev: () => Promise<void>
  seek: (t: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  setCrossfade: (sec: number) => void
  setSleepTimer: (min: number) => void
  _loadIndex: (i: number) => Promise<void>
}

export const usePlayer = create<State & Actions>()(
  persist(
    (set, get) => ({
      queue: [],
      index: -1,
      current: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      volume: 0.7,
      muted: false,
      shuffle: false,
      repeat: 'off',
      audio: null,

      init: () => {
        if (get().audio) return
        const audio = new Audio()
        audio.volume = get().volume
        audio.addEventListener('timeupdate', () => set({ position: audio.currentTime }))
        audio.addEventListener('durationchange', () => set({ duration: audio.duration }))
        audio.addEventListener('ended', () => get().next())
        audio.addEventListener('play', () => set({ isPlaying: true }))
        audio.addEventListener('pause', () => set({ isPlaying: false }))
        set({ audio })
      },

      setQueue: async (tracks, startAt = 0) => {
        set({ queue: tracks, index: startAt })
        await get()._loadIndex(startAt)
      },

      play: () => get().audio?.play().catch(() => {}),
      pause: () => get().audio?.pause(),
      toggle: () => (get().isPlaying ? get().pause() : get().play()),

      next: async () => {
        const { queue, index, repeat, shuffle } = get()
        if (!queue.length) return
        let nxt = index + 1
        if (shuffle) nxt = Math.floor(Math.random() * queue.length)
        if (nxt >= queue.length) {
          if (repeat === 'all') nxt = 0
          else { get().pause(); return }
        }
        await get()._loadIndex(nxt)
      },

      prev: async () => {
        const { queue, index, audio } = get()
        if (audio && audio.currentTime > 3) { audio.currentTime = 0; return }
        const nxt = Math.max(0, index - 1)
        await get()._loadIndex(nxt)
      },

      seek: (t) => { const a = get().audio; if (a) a.currentTime = t },

      setVolume: (v) => {
        const a = get().audio; if (a) a.volume = v
        set({ volume: v, muted: false })
      },

      toggleMute: () => {
        const a = get().audio
        const m = !get().muted
        if (a) a.muted = m
        set({ muted: m })
      },

      toggleShuffle: () => set({ shuffle: !get().shuffle }),
      cycleRepeat: () => {
        const cur = get().repeat
        const next: Repeat = cur === 'off' ? 'all' : cur === 'all' ? 'one' : 'off'
        const a = get().audio; if (a) a.loop = next === 'one'
        set({ repeat: next })
      },
      setCrossfade: (sec) => { _crossfadeSec = Math.max(0, Math.min(12, sec)) },
      setSleepTimer: (min) => {
        if (_sleepTimer) { clearTimeout(_sleepTimer); _sleepTimer = null }
        if (min > 0) {
          _sleepTimer = setTimeout(() => { get().pause() }, min * 60_000)
        }
      },

      _loadIndex: async (i) => {
        const t = get().queue[i]
        if (!t) return
        set({ index: i, current: t, position: 0 })
        let url = t.url
        if (!url) {
          const q = t.query || `${t.title} ${t.artist}`.trim()
          // 1) JioSaavn match (fast, no cookies needed)
          try {
            const r = await api.matchAudio(q)
            url = r.results?.[0]?.url
          } catch {}
          // 2) YouTube Music fallback (Western catalogue)
          if (!url) {
            try {
              const r = await api.ytSearch(q)
              const vid = r.results?.[0]?.video_id
              if (vid) {
                const s = await api.ytStream(vid)
                url = s.url
              }
            } catch {}
          }
        }
        const a = get().audio
        if (!a || !url) return
        a.src = url
        try { await a.play() } catch {}
      },
    }),
    {
      name: 'vs-player',
      partialize: (s) => ({ volume: s.volume, shuffle: s.shuffle, repeat: s.repeat }),
    }
  )
)
