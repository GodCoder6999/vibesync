import { useState } from 'react'
import { usePlayer, setEqBand, getEqBands, EQ_BAND_LABELS } from '@/stores/playerStore'
import { useLikes } from '@/stores/likesStore'
import { useRecents } from '@/stores/recentsStore'

export default function Settings() {
  const { volume, shuffle, repeat, setVolume, toggleShuffle, cycleRepeat } = usePlayer()
  const clearLikes = () => {
    if (confirm('Remove all liked songs?')) {
      localStorage.removeItem('vs-likes')
      location.reload()
    }
  }
  const clearRecents = () => useRecents.getState().clear()
  const [cf, setCf] = useState<number>(() => Number(localStorage.getItem('vs-crossfade') || 0))
  const [sleep, setSleep] = useState<number>(() => Number(localStorage.getItem('vs-sleep') || 0))

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-4xl font-extrabold text-white mb-8">Settings</h1>

      <Section title="Playback">
        <Row label="Volume">
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-white" />
          <span className="text-sm text-[var(--color-text-muted)] w-12 text-right">{Math.round(volume * 100)}%</span>
        </Row>
        <Row label="Shuffle">
          <Toggle on={shuffle} onChange={toggleShuffle} />
        </Row>
        <Row label="Repeat">
          <button onClick={cycleRepeat} className="px-3 py-1.5 rounded-full bg-[var(--color-bg-hover)] text-sm capitalize">{repeat}</button>
        </Row>
        <Row label="Crossfade (seconds)">
          <input type="range" min={0} max={12} step={1} value={cf} onChange={(e) => { const v = Number(e.target.value); setCf(v); localStorage.setItem('vs-crossfade', String(v)); usePlayer.getState().setCrossfade?.(v) }} className="w-full accent-white" />
          <span className="text-sm text-[var(--color-text-muted)] w-12 text-right">{cf}s</span>
        </Row>
        <Row label="Sleep timer (minutes)">
          <select
            value={sleep}
            onChange={(e) => {
              const v = Number(e.target.value)
              setSleep(v)
              localStorage.setItem('vs-sleep', String(v))
              usePlayer.getState().setSleepTimer?.(v)
            }}
            className="bg-[var(--color-bg-hover)] text-white px-3 py-2 rounded-md text-sm"
          >
            {[0, 5, 10, 15, 30, 45, 60].map((m) => <option key={m} value={m}>{m === 0 ? 'Off' : `${m} min`}</option>)}
          </select>
        </Row>
      </Section>

      <Section title="Equalizer">
        <Eq />
      </Section>

      <Section title="Library">
        <Row label={`Liked Songs (${useLikes.getState().tracks.length})`}>
          <button onClick={clearLikes} className="text-[var(--color-danger)] text-sm">Clear all</button>
        </Row>
        <Row label="Recent searches">
          <button onClick={clearRecents} className="text-[var(--color-danger)] text-sm">Clear</button>
        </Row>
      </Section>

      <Section title="Keyboard shortcuts">
        <Kbd k="Space" desc="Play / pause" />
        <Kbd k="Shift + →" desc="Next track" />
        <Kbd k="Shift + ←" desc="Previous track" />
        <Kbd k="Ctrl + ↑/↓" desc="Volume up/down" />
        <Kbd k="M" desc="Mute" />
        <Kbd k="L" desc="Like current track" />
        <Kbd k="S" desc="Toggle shuffle" />
        <Kbd k="R" desc="Cycle repeat" />
        <Kbd k="F" desc="Fullscreen" />
        <Kbd k="Ctrl + K  /  /" desc="Focus search" />
      </Section>

      <Section title="About">
        <Row label="Catalogue source"><span className="text-sm text-[var(--color-text-muted)]">Spotify (via SpotAPI scrape)</span></Row>
        <Row label="Audio source"><span className="text-sm text-[var(--color-text-muted)]">JioSaavn (match by title + artist)</span></Row>
        <Row label="Build"><span className="text-sm text-[var(--color-text-muted)]">v2 / React + Vite</span></Row>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-white mb-3 border-b border-white/10 pb-2">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: any }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-center gap-4">
      <div className="text-sm text-white">{label}</div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-10 h-6 rounded-full p-0.5 transition ${on ? 'bg-[var(--color-accent)]' : 'bg-white/20'}`}>
      <div className={`w-5 h-5 rounded-full bg-white transition ${on ? 'translate-x-4' : ''}`} />
    </button>
  )
}

function Eq() {
  const [bands, setBands] = useState<number[]>(getEqBands())
  function update(i: number, v: number) {
    setEqBand(i, v)
    setBands((b) => b.map((x, idx) => idx === i ? v : x))
  }
  function preset(name: string) {
    const presets: Record<string, number[]> = {
      Flat:    [0, 0, 0, 0, 0],
      Bass:    [6, 4, 0, -2, -2],
      Vocal:   [-2, 0, 4, 3, 0],
      Treble:  [-2, -1, 0, 3, 6],
      Lounge:  [-3, 0, 2, -1, -3],
    }
    const v = presets[name]
    if (!v) return
    v.forEach((db, i) => setEqBand(i, db))
    setBands(v)
  }
  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['Flat','Bass','Vocal','Treble','Lounge'].map((p) => (
          <button key={p} onClick={() => preset(p)} className="px-3 py-1.5 rounded-full bg-[var(--color-bg-hover)] text-sm">{p}</button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-3 max-w-md">
        {EQ_BAND_LABELS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">+12</span>
            <input
              type="range"
              min={-12}
              max={12}
              value={bands[i] ?? 0}
              onChange={(e) => update(i, Number(e.target.value))}
              className="accent-[var(--color-accent)]"
              style={{ writingMode: 'vertical-lr' as any, transform: 'rotate(180deg)', WebkitAppearance: 'slider-vertical' as any, height: 120, width: 24 }}
            />
            <span className="text-xs text-[var(--color-text-muted)]">-12</span>
            <span className="text-xs text-white">{label}</span>
            <span className="text-xs text-[var(--color-accent)]">{bands[i] ?? 0} dB</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Kbd({ k, desc }: { k: string; desc: string }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 text-sm">
      <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-xs justify-self-start">{k}</kbd>
      <span className="text-[var(--color-text-muted)]">{desc}</span>
    </div>
  )
}
