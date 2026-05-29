import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useRecents } from '@/stores/recentsStore'
import { useLikes } from '@/stores/likesStore'
import { usePlayer } from '@/stores/playerStore'
import { Icon } from './Icon'

type Suggestion =
  | { kind: 'track'; data: any; id: string }
  | { kind: 'tile';  data: any; id: string; type: string }

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function SearchBar() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const debounced = useDebounced(q.trim(), 250)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recents = useRecents((s) => s.items)
  const pushRecent = useRecents((s) => s.push)
  const isLiked = useLikes((s) => s.isLiked)
  const setQueue = usePlayer((s) => s.setQueue)

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.search(debounced, 6),
    enabled: !!debounced,
    staleTime: 5 * 60_000,
  })

  // Cmd/Ctrl+K and "/" shortcuts to focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }
      // Bare "/" only when not typing in an input/textarea
      if (e.key === '/' && !(e.target as HTMLElement)?.matches('input, textarea, [contenteditable]')) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const showing: 'recents' | 'results' = debounced ? 'results' : 'recents'

  const suggestions: Suggestion[] = (() => {
    if (showing === 'recents') {
      return recents.flatMap<Suggestion>((r): Suggestion[] => {
        if (r.kind === 'track') return [{ kind: 'track', data: r, id: r.id }]
        if (r.kind === 'tile')  return [{ kind: 'tile', data: r, id: r.id, type: r.type }]
        return []
      })
    }
    if (!data) return []
    const out: Suggestion[] = []
    for (const t of (data.tracks || []).slice(0, 4)) out.push({ kind: 'track', data: t, id: t.id })
    for (const a of (data.artists || []).slice(0, 2)) out.push({ kind: 'tile', data: a, id: a.id, type: a.type })
    for (const a of (data.albums || []).slice(0, 2)) out.push({ kind: 'tile', data: a, id: a.id, type: a.type })
    return out
  })()

  function commit(s: Suggestion) {
    if (s.kind === 'track') {
      const t = s.data
      pushRecent({ kind: 'track', ...t })
      setQueue([t], 0)
    } else {
      const t = s.data
      pushRecent({ kind: 'tile', ...t })
      const path =
        t.type === 'sx-artist'   ? `/artist/${t.id}` :
        t.type === 'sx-album'    ? `/album/${t.id}`  :
        t.type === 'sx-playlist' ? `/playlist/${t.id}` :
        t.type === 'sx-podcast'  ? `/podcast/${t.id}` :
        `/search/${encodeURIComponent(t.title || '')}`
      nav(path)
    }
    setOpen(false)
    inputRef.current?.blur()
  }

  function submitQuery(qq: string) {
    if (!qq) return
    pushRecent({ kind: 'query', q: qq })
    nav(`/search/${encodeURIComponent(qq)}`)
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={wrapRef} className="relative flex-1 max-w-[420px]">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--color-bg-elevated)] border ${open ? 'border-white' : 'border-transparent'} transition-colors`}>
        <Icon name="search" className="w-5 h-5 text-[var(--color-text-muted)]" filled />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setCursor(-1); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setCursor((c) => Math.min(c + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setCursor((c) => Math.max(c - 1, -1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (cursor >= 0 && suggestions[cursor]) commit(suggestions[cursor])
              else submitQuery(q.trim())
            } else if (e.key === 'Escape') {
              setOpen(false); inputRef.current?.blur()
            }
          }}
          data-encore-id="formInput"
          role="combobox"
          aria-owns="search-dropdown"
          aria-controls="search-dropdown"
          aria-expanded={open}
          data-testid="search-input"
          aria-label="What do you want to play?"
          data-top-bar-search="true"
          type="search"
          spellCheck="false"
          tabIndex={0}
          placeholder="What do you want to play?"
          className="flex-1 bg-transparent outline-none text-sm text-white text-ellipsis cursor-pointer rounded-[500px] placeholder:text-[var(--color-text-muted)] focus:cursor-[unset] focus:shadow-[rgb(255,255,255)_0px_0px_0px_2px_inset]"
        />
        {q ? (
          <button onMouseDown={(e) => { e.preventDefault(); setQ(''); inputRef.current?.focus() }} className="text-[var(--color-text-muted)] hover:text-white text-lg">×</button>
        ) : (
          <span className="hidden md:flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
            <kbd className="px-1 rounded border border-white/20">Ctrl</kbd>
            <kbd className="px-1 rounded border border-white/20">K</kbd>
          </span>
        )}
        <span className="w-px h-5 bg-white/15 mx-1" />
        <button onClick={() => nav('/search')} title="Browse" className="text-[var(--color-text-muted)] hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm2 2v6h6V5H5zm8 0v6h6V5h-6zM5 13v6h6v-6H5zm8 0v6h6v-6h-6z"/></svg>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-2 max-h-[480px] overflow-y-auto rounded-lg bg-[var(--color-bg-elevated)] shadow-2xl border border-white/5 z-50">
          {showing === 'recents' && suggestions.length === 0 && recents.length === 0 && (
            <div className="px-4 py-6 text-sm text-[var(--color-text-muted)]">Try typing a song, artist or album.</div>
          )}

          {showing === 'results' && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-[10px] text-[var(--color-text-muted)]">
              <span className="flex items-center gap-2">
                <kbd className="px-1 rounded border border-white/20">↑</kbd>
                <kbd className="px-1 rounded border border-white/20">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-1 rounded border border-white/20">Enter</kbd>
                <span>{cursor >= 0 ? 'Play' : 'Search'}</span>
              </span>
            </div>
          )}

          {showing === 'recents' && recents.length > 0 && (
            <div className="px-4 py-2 text-xs font-bold text-white">Recent searches</div>
          )}

          {recents.filter((r) => r.kind === 'query').length > 0 && showing === 'recents' && (
            <div>
              {recents.filter((r) => r.kind === 'query').slice(0, 4).map((r: any) => (
                <button key={r.q} onClick={() => submitQuery(r.q)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-left">
                  <Icon name="search" className="w-4 h-4 text-[var(--color-text-muted)]" filled />
                  <span className="text-white text-sm">{r.q}</span>
                </button>
              ))}
            </div>
          )}

          {suggestions.map((s, i) => {
            const t = s.data
            const isSaved = s.kind === 'track' && isLiked(s.id)
            return (
              <button
                key={`${s.kind}-${s.id}-${i}`}
                onMouseDown={(e) => { e.preventDefault(); commit(s) }}
                onMouseEnter={() => setCursor(i)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left ${cursor === i ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className={`w-10 h-10 ${s.kind === 'tile' && s.type === 'sx-artist' ? 'rounded-full' : 'rounded'} bg-cover bg-center bg-[var(--color-bg-pressed)]`} style={{ backgroundImage: t.img ? `url("${t.img}")` : undefined }} />
                <div className="min-w-0 flex-1">
                  <div className="text-white text-sm truncate">{t.title}</div>
                  <div className="text-xs text-[var(--color-text-muted)] truncate">
                    {s.kind === 'track' ? `Song • ${t.artist}` : `${labelFor(s.type)}${t.subtitle ? ' • ' + t.subtitle : ''}`}
                  </div>
                </div>
                {isSaved && (
                  <span title="In your library" className="w-5 h-5 rounded-full bg-[var(--color-accent)] grid place-items-center">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="black"><path d="M14.207 4.793a1 1 0 0 1 0 1.414L7.5 12.914 2.793 8.207a1 1 0 1 1 1.414-1.414L7.5 10.086l5.293-5.293a1 1 0 0 1 1.414 0z"/></svg>
                  </span>
                )}
              </button>
            )
          })}

          {showing === 'results' && !isFetching && suggestions.length === 0 && (
            <div className="px-4 py-6 text-sm text-[var(--color-text-muted)]">No matches.</div>
          )}
          {showing === 'results' && isFetching && (
            <div className="px-4 py-6 text-sm text-[var(--color-text-muted)]">Searching…</div>
          )}
        </div>
      )}
    </div>
  )
}

function labelFor(type: string) {
  return ({
    'sx-artist':   'Artist',
    'sx-album':    'Album',
    'sx-playlist': 'Playlist',
    'sx-podcast':  'Podcast',
    'sx-episode':  'Episode',
  } as Record<string, string>)[type] || ''
}
