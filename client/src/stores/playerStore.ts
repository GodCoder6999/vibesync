import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '@/types'
import { api } from '@/lib/api'

type Repeat = 'off' | 'all' | 'one'

// Module-level (non-reactive) audio graph state.
let _crossfadeSec = Number(localStorage.getItem('vs-crossfade') || 0)
let _sleepTimer: ReturnType<typeof setTimeout> | null = null
let _ctx: AudioContext | null = null
let _srcA: MediaElementAudioSourceNode | null = null
let _srcB: MediaElementAudioSourceNode | null = null
let _gainA: GainNode | null = null
let _gainB: GainNode | null = null
let _eq: BiquadFilterNode[] = []
let _audioB: HTMLAudioElement | null = null
let _crossfading = false

const EQ_BANDS = [60, 250, 1000, 4000, 12000]

function _initGraph(audio: HTMLAudioElement) {
  if (_ctx) return
  try {
    _ctx = new AudioContext()
    _audioB = new Audio()
    _audioB.crossOrigin = 'anonymous'
    _srcA = _ctx.createMediaElementSource(audio)
    _srcB = _ctx.createMediaElementSource(_audioB)
    _gainA = _ctx.createGain(); _gainA.gain.value = 1
    _gainB = _ctx.createGain(); _gainB.gain.value = 0
    // 5-band EQ chained after the gain stage
    let prev: AudioNode = _gainA
    let prevB: AudioNode = _gainB
    _eq = EQ_BANDS.map((f) => {
      const node = _ctx!.createBiquadFilter()
      node.type = 'peaking'; node.frequency.value = f; node.Q.value = 1; node.gain.value = 0
      return node
    })
    // Apply EQ on the merged output, simpler: connect both gains -> first EQ -> ... -> destination
    const merge = _ctx.createGain()
    _gainA.connect(merge)
    _gainB.connect(merge)
    prev = merge
    for (const node of _eq) { prev.connect(node); prev = node }
    prev.connect(_ctx.destination)
    _srcA.connect(_gainA)
    _srcB.connect(_gainB)
  } catch (e) {
    // Some browsers block AudioContext until first user gesture; retry later.
    _ctx = null
  }
}

export function setEqBand(i: number, db: number) {
  if (_eq[i]) _eq[i].gain.value = db
  const arr = _eq.map((n) => n.gain.value)
  localStorage.setItem('vs-eq', JSON.stringify(arr))
}
export function getEqBands(): number[] {
  if (_eq.length) return _eq.map((n) => n.gain.value)
  try { return JSON.parse(localStorage.getItem('vs-eq') || '[0,0,0,0,0]') } catch { return [0,0,0,0,0] }
}
export const EQ_BAND_LABELS = ['60', '250', '1k', '4k', '12k']

type State = {
  queue: Track[]
  index: number
  current: Track | null
  isPlaying: boolean
  position: number
  duration: number
  volume: number
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
        audio.crossOrigin = 'anonymous'
        audio.volume = get().volume
        audio.addEventListener('timeupdate', () => {
          set({ position: audio.currentTime })
          // Trigger crossfade near end of track
          if (_crossfadeSec > 0 && !_crossfading && audio.duration && (audio.duration - audio.currentTime) <= _crossfadeSec) {
            void _beginCrossfade(get)
          }
        })
        audio.addEventListener('durationchange', () => set({ duration: audio.duration }))
        audio.addEventListener('ended', () => { if (!_crossfading) get().next() })
        audio.addEventListener('play', () => { _ctx?.resume(); set({ isPlaying: true }) })
        audio.addEventListener('pause', () => set({ isPlaying: false }))
        set({ audio })
        _initGraph(audio)
        // Restore EQ
        try {
          const arr = JSON.parse(localStorage.getItem('vs-eq') || '[]')
          if (Array.isArray(arr)) arr.forEach((v: number, i: number) => { if (_eq[i]) _eq[i].gain.value = v })
        } catch {}
      },

      setQueue: async (tracks, startAt = 0) => {
        set({ queue: tracks, index: startAt })
        await get()._loadIndex(startAt)
      },

      play: () => { _ctx?.resume(); get().audio?.play().catch(() => {}) },
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
      setCrossfade: (sec) => {
        _crossfadeSec = Math.max(0, Math.min(12, sec))
        localStorage.setItem('vs-crossfade', String(_crossfadeSec))
      },
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
          try {
            const r = await api.matchAudio(q)
            url = r.results?.[0]?.url
          } catch {}
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

async function _beginCrossfade(getState: () => State & Actions) {
  if (!_ctx || !_gainA || !_gainB || !_audioB) return
  const s = getState()
  const { queue, index, repeat, shuffle } = s
  if (!queue.length) return
  let nxt = index + 1
  if (shuffle) nxt = Math.floor(Math.random() * queue.length)
  if (nxt >= queue.length) { if (repeat !== 'all') return; nxt = 0 }
  const t = queue[nxt]
  if (!t) return

  // Resolve URL same way as _loadIndex
  let url = t.url
  if (!url) {
    try { url = (await api.matchAudio(t.query || `${t.title} ${t.artist}`.trim())).results?.[0]?.url } catch {}
    if (!url) {
      try {
        const r = await api.ytSearch(t.query || `${t.title} ${t.artist}`.trim())
        const vid = r.results?.[0]?.video_id
        if (vid) url = (await api.ytStream(vid)).url
      } catch {}
    }
  }
  if (!url) return

  _crossfading = true
  _audioB.src = url
  try { await _audioB.play() } catch { _crossfading = false; return }

  const now = _ctx.currentTime
  _gainA.gain.cancelScheduledValues(now)
  _gainB.gain.cancelScheduledValues(now)
  _gainA.gain.setValueAtTime(_gainA.gain.value, now)
  _gainB.gain.setValueAtTime(0, now)
  _gainA.gain.linearRampToValueAtTime(0, now + _crossfadeSec)
  _gainB.gain.linearRampToValueAtTime(1, now + _crossfadeSec)

  setTimeout(() => {
    // Swap roles: audio B becomes primary
    const old = usePlayer.getState().audio
    if (old && _audioB) {
      // Move tracking listeners to new primary by replacing the audio reference
      usePlayer.setState({ audio: _audioB, index: nxt, current: t, position: 0 })
      // Re-wire: now _audioB is primary, swap source nodes + gains
      const tmpSrc = _srcA; _srcA = _srcB; _srcB = tmpSrc
      const tmpG = _gainA;  _gainA = _gainB; _gainB = tmpG
      _audioB = old
      _audioB.pause()
      // Reset secondary gain
      if (_gainB) _gainB.gain.setValueAtTime(0, _ctx!.currentTime)
    }
    _crossfading = false
  }, _crossfadeSec * 1000 + 50)
}
