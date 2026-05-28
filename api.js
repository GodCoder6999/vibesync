// VibeSync music client.
//
// 1) Local proxy /api/search → JioSaavn (full 320kbps songs, decrypted server-side).
//    Run via `python serve.py`. Catalog: global pop + Bollywood, full length.
// 2) Audius (fallback) — indie/electronic full tracks.
// 3) iTunes (last-resort fallback) — 30s previews of any mainstream song.

const API_BASE = (window.VS_CONFIG && window.VS_CONFIG.API_BASE) || '';
const PROXY  = API_BASE + '/api/search';
const ITUNES = 'https://itunes.apple.com/search';
const AUDIUS = 'https://discoveryprovider.audius.co/v1';
const APP_NAME = 'VibeSync';

async function searchProxy(query) {
  try {
    const r = await fetch(`${PROXY}?q=${encodeURIComponent(query)}&limit=10`);
    if (!r.ok) throw new Error('proxy ' + r.status);
    const j = await r.json();
    return (j.results || []).map(t => ({ ...t, id: 'jio-' + t.id }));
  } catch (e) {
    console.warn('[proxy] failed', e);
    return [];
  }
}

const audio = new Audio();
audio.preload = 'metadata';
// NOTE: do NOT set audio.crossOrigin — iTunes preview server doesn't return
// CORS headers; setting it would block playback with MEDIA_ERR_SRC_NOT_SUPPORTED.
let currentTrack = null;

// ---------------- iTunes ----------------
async function searchItunes(query) {
  try {
    const url = `${ITUNES}?term=${encodeURIComponent(query)}&entity=song&limit=12`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('iTunes ' + r.status);
    const j = await r.json();
    return (j.results || []).filter(s => s.previewUrl).map(s => ({
      id: 'it-' + s.trackId,
      title: s.trackName,
      artist: s.artistName,
      album: s.collectionName,
      img: (s.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg'),
      url: s.previewUrl,
      duration: Math.floor((s.trackTimeMillis || 30000) / 1000),
      preview: true,
      source: 'iTunes'
    }));
  } catch (e) {
    console.warn('[itunes] failed', e);
    return [];
  }
}

// ---------------- Audius ----------------
async function searchAudius(query) {
  try {
    const url = `${AUDIUS}/tracks/search?query=${encodeURIComponent(query)}&app_name=${APP_NAME}&limit=8`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Audius ' + r.status);
    const j = await r.json();
    return (j.data || [])
      .filter(t => t.is_streamable && t.stream?.url)
      .map(t => ({
        id: 'au-' + t.id,
        title: t.title,
        artist: t.user?.name || t.user?.handle || 'Unknown',
        album: t.genre || 'Audius',
        img: t.artwork?.['480x480'] || t.artwork?.['1000x1000'] || t.artwork?.['150x150'] || '',
        url: t.stream.url,
        duration: t.duration || 0,
        preview: false,
        source: 'Audius'
      }));
  } catch (e) {
    console.warn('[audius] failed', e);
    return [];
  }
}

async function searchAll(query) {
  const jio = await searchProxy(query);
  if (jio.length) return jio;
  const [au, it] = await Promise.all([searchAudius(query), searchItunes(query)]);
  return [...au, ...it];
}

// ---------------- Playback ----------------
async function playTrack(track) {
  currentTrack = track;
  updateNowPlaying(track, { loading: true });
  try {
    console.log('[vibesync] play', track.source, track.title, '→', track.url);
    audio.src = track.url;
    await audio.play();
    updateNowPlaying(track, { playing: true });
    loadLyricsFor(track);
  } catch (e) {
    console.error('[vibesync] playback failed', e);
    updateNowPlaying(track, { error: e.message });
    toast('Could not play "' + track.title + '" — ' + e.message);
  }
}

async function loadLyricsFor(track) {
  const box = document.querySelector('[data-lyrics-content]');
  if (!box) return;
  box.textContent = 'Loading lyrics…';
  try {
    const r = await fetch(API_BASE + '/api/lyrics?title=' + encodeURIComponent(track.title) + '&artist=' + encodeURIComponent(track.artist || ''));
    const d = await r.json();
    if (d.instrumental) box.textContent = '♪ Instrumental';
    else if (d.plain) box.textContent = d.plain;
    else box.textContent = 'No lyrics found.';
  } catch (e) { box.textContent = 'Lyrics unavailable.'; }
}

async function searchAndPlay(query) {
  toast('Searching "' + query + '"…');
  const results = await searchAll(query);
  if (!results.length) {
    toast('No results for "' + query + '". Try simpler keywords.');
    return null;
  }
  await playTrack(results[0]);
  return results[0];
}

// ---------------- UI ----------------
function updateNowPlaying(track, state = {}) {
  document.querySelectorAll('[data-np-title]').forEach(el => el.textContent = track.title);
  document.querySelectorAll('[data-np-artist]').forEach(el => {
    if (state.loading) el.textContent = 'Loading…';
    else if (state.error) el.textContent = 'Error: ' + state.error;
    else el.textContent = `${track.artist} · ${track.source}${track.preview ? ' (30s preview)' : ''}`;
  });
  document.querySelectorAll('[data-np-cover]').forEach(el => {
    if (track.img) {
      el.style.backgroundImage = `url("${track.img}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.background = `url("${track.img}") center/cover`;
    }
  });
  syncPlayIcons();
}

function syncPlayIcons() {
  const playing = !audio.paused && !audio.ended && audio.readyState > 0;
  document.body.classList.toggle('playing', playing);
  document.querySelectorAll('[data-play-icon]').forEach(btn => {
    const big = btn.classList.contains('play-big');
    const size = big ? 24 : 16;
    btn.innerHTML = playing
      ? `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="currentColor"><path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"/></svg>`
      : `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>`;
  });
}

audio.addEventListener('play', syncPlayIcons);
audio.addEventListener('pause', syncPlayIcons);
audio.addEventListener('ended', syncPlayIcons);
audio.addEventListener('error', () => {
  const codes = { 1: 'aborted', 2: 'network', 3: 'decode', 4: 'src not supported' };
  const msg = audio.error ? codes[audio.error.code] || 'unknown' : 'unknown';
  console.error('[vibesync] audio error', msg, audio.error);
  toast('Audio error: ' + msg);
});
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.querySelectorAll('[data-progress-fill]').forEach(el => el.style.width = pct + '%');
  document.querySelectorAll('[data-current-time]').forEach(el => el.textContent = fmtTime(audio.currentTime));
});
audio.addEventListener('loadedmetadata', () => {
  document.querySelectorAll('[data-duration]').forEach(el => el.textContent = fmtTime(audio.duration));
});

function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function togglePlay() {
  if (!audio.src) { toast('Pick a track first.'); return; }
  if (audio.paused) audio.play().catch(e => toast('Play blocked: ' + e.message));
  else audio.pause();
}
function seek(pct) { if (audio.duration) audio.currentTime = audio.duration * Math.max(0, Math.min(1, pct)); }
function setVolume(pct) { audio.volume = Math.max(0, Math.min(1, pct)); }

function toast(msg) {
  let t = document.getElementById('vs-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'vs-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);background:rgba(20,14,40,0.96);border:1px solid rgba(255,255,255,0.14);color:#fff;padding:12px 20px;border-radius:999px;font-size:13px;z-index:300;box-shadow:0 12px 32px rgba(0,0,0,0.5);backdrop-filter:blur(20px);max-width:90vw;text-align:center;transition:opacity 0.3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toast._h);
  toast._h = setTimeout(() => { t.style.opacity = '0'; }, 3500);
  console.log('[vibesync]', msg);
}

// ---------------- Wire ----------------
function init() {
  document.body.addEventListener('click', (e) => {
    const sr = e.target.closest('[data-track-json]');
    if (sr) {
      e.preventDefault(); e.stopPropagation();
      try { playTrack(JSON.parse(sr.getAttribute('data-track-json'))); } catch (err) { console.error(err); }
      const panel = document.querySelector('[data-search-results]');
      if (panel) panel.style.display = 'none';
      const input = document.querySelector('[data-search-input]');
      if (input) input.value = '';
      return;
    }
    if (e.target.closest('[data-play-toggle]')) { e.preventDefault(); togglePlay(); return; }
    const card = e.target.closest('[data-play-query]');
    if (card) { e.preventDefault(); searchAndPlay(card.getAttribute('data-play-query')); return; }
    const bar = e.target.closest('[data-seek]');
    if (bar && !e.target.closest('[data-track-json]')) {
      const rect = bar.getBoundingClientRect();
      seek((e.clientX - rect.left) / rect.width);
      return;
    }
    const vol = e.target.closest('[data-volume]');
    if (vol) {
      const rect = vol.getBoundingClientRect();
      const p = (e.clientX - rect.left) / rect.width;
      setVolume(p);
      vol.querySelector('div').style.width = (p * 100) + '%';
    }
  });

  const searchInput = document.querySelector('[data-search-input]');
  if (searchInput) {
    let t;
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      const q = searchInput.value.trim();
      if (!q) { renderSearch(null); return; }
      renderSearch('loading');
      t = setTimeout(async () => {
        const results = await searchAll(q);
        renderSearch(results);
      }, 300);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (q) searchAndPlay(q);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-search-input], [data-search-results]')) {
      const panel = document.querySelector('[data-search-results]');
      if (panel) panel.style.display = 'none';
    }
  });

  console.log('[vibesync] ready — iTunes + Audius wired');
  prefetchCovers();
}

// On page load, look up a real poster + full stream URL for each card.
// Uses the JioSaavn proxy so the click plays full-length 320kbps instantly.
async function prefetchCovers() {
  const cards = Array.from(document.querySelectorAll('[data-play-query]'));
  const cache = JSON.parse(sessionStorage.getItem('vs_covers_v2') || '{}');

  for (const card of cards) {
    const q = card.getAttribute('data-play-query');
    if (!q) continue;
    const cover = card.querySelector('.cover, .mini-cover');
    try {
      let track = cache[q];
      if (!track) {
        const r = await fetch(`${PROXY}?q=${encodeURIComponent(q)}&limit=1`);
        if (!r.ok) continue;
        const j = await r.json();
        track = (j.results || [])[0];
        if (!track) continue;
        track.id = 'jio-' + track.id;
        cache[q] = track;
        sessionStorage.setItem('vs_covers_v2', JSON.stringify(cache));
      }
      if (cover && track.img) {
        cover.style.backgroundImage = `url("${track.img}")`;
        cover.style.backgroundSize = 'cover';
        cover.style.backgroundPosition = 'center';
      }
      card.dataset.trackJson = JSON.stringify(track);
    } catch (e) {
      console.warn('prefetch fail', q, e);
    }
    await new Promise(r => setTimeout(r, 60));
  }
  console.log('[vibesync] covers prefetched');
}

function renderSearch(results) {
  const panel = document.querySelector('[data-search-results]');
  if (!panel) return;
  if (results === null) { panel.innerHTML = ''; panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  if (results === 'loading') {
    panel.innerHTML = '<div class="search-results-head">Searching iTunes + Audius…</div>';
    return;
  }
  if (!results.length) {
    panel.innerHTML = '<div class="search-results-head">No results — try simpler keywords or check console.</div>';
    return;
  }
  panel.innerHTML = `
    <div class="search-results-head">${results.length} result${results.length>1?'s':''} · click to play</div>
    <div class="search-results-list">
      ${results.slice(0, 10).map(r => `
        <button class="search-result" data-track-json='${escapeAttr(JSON.stringify(r))}'>
          <div class="sr-cover" ${r.img ? `style="background-image:url(&quot;${r.img}&quot;);background-size:cover;background-position:center"` : ''}></div>
          <div class="sr-meta">
            <strong>${escapeHtml(r.title)}</strong>
            <span>${escapeHtml(r.artist)} · ${r.source}${r.preview ? ' · 30s' : ''}</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8V4z"/></svg>
        </button>
      `).join('')}
    </div>`;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) {
  return String(s).replace(/'/g, '&#39;');
}

// Expose for pages that render cards dynamically (home.js, catalog tiles)
window.vsPrefetch = prefetchCovers;
window.vsAudio = audio;
window.searchAndPlay = searchAndPlay;
window.updateNowPlaying = updateNowPlaying;
window.playTrack = playTrack;
window.loadLyricsFor = loadLyricsFor;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
