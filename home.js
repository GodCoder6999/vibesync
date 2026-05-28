// VibeSync home — Spotify visual layout pulling JioSaavn data.
// Quick-picks (3-col tiles) + horizontal card rows.

async function render() {
  try { await doRender(); }
  catch (e) {
    console.error('[home] fatal', e);
    const d = document.getElementById('dynSections');
    if (d) d.innerHTML = `<p style="padding:32px;color:#ff6b6b">Error: ${e.message}</p>`;
  }
}

async function doRender() {
  const full = JSON.parse(localStorage.getItem('vs_prefs_full') || 'null');
  const user = JSON.parse(localStorage.getItem('vs_user') || '{}');
  const prefs = JSON.parse(localStorage.getItem('vs_prefs') || '[]');

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = greeting;
  const ua = document.getElementById('userAvatar');
  if (ua) ua.textContent = (user.name || 'U')[0].toUpperCase();

  // ---- Spotify curated home (real Spotify metadata via RapidAPI) ----
  const rx = await window.cat.rxHome().catch(e => { console.warn('rx home fail', e); return {}; });
  const playlists = rx.playlists || [];
  const artists = rx.artists || [];

  // Quick picks — top 6 playlists
  const quick = playlists.slice(0, 6);
  document.getElementById('quickPicks').innerHTML = quick.map(t => `
    <button class="qp-tile" data-cat-tile='${escAttr(JSON.stringify(t))}'>
      <div class="qp-cover" data-rx-cover='${escAttr(JSON.stringify({type:'playlist', id:t.id}))}' ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
      <strong>${esc(t.title)}</strong>
      <div class="qp-fab"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></div>
    </button>`).join('');

  // Sections: Featured Playlists + Popular Artists
  const container = document.getElementById('dynSections');
  const sections = [];
  if (playlists.length) sections.push({ title: 'Featured Playlists', items: playlists, kind: 'playlist' });
  if (artists.length)   sections.push({ title: 'Popular Artists',    items: artists,   kind: 'artist'   });

  container.innerHTML = sections.map(sec => sectionHTML(sec.title, sec.items.slice(0, 8), sec.kind)).join('');

  // Lazy-load covers from RapidAPI (one request per tile, cached)
  loadRxCovers();

  // ---- User-pref mix rows (JioSaavn fallback for taste-based recs) ----
  const userArtists = full?.artists || [];
  const genres = full?.genres || prefs.filter(p => !userArtists.includes(p));
  const ordered = [...userArtists, ...genres].slice(0, 4);
  if (ordered.length) {
    container.innerHTML += ordered.map(p => `
      <section class="section" data-pref="${escAttr(p)}">
        <div class="section-head"><h2>${esc(p)} Mix</h2><a href="explore.html">Show all</a></div>
        <div class="card-row skel">${cardSkel().repeat(6)}</div>
      </section>`).join('');

    await Promise.all(ordered.map(async (p) => {
      const data = await window.cat.search(p, 12);
      const sec = container.querySelector(`[data-pref="${cssEsc(p)}"] .card-row`);
      if (!sec) return;
      const cleaned = (data.results || []).filter(t => {
        const s = (t.title || '').toLowerCase();
        return !s.includes('karaoke') && !s.includes('instrumental') && !s.includes('tribute');
      }).slice(0, 8);
      sec.outerHTML = trackCardRow(cleaned);
      cleaned.forEach(t => swapToCleanCover(p, t));
    }));
  }

  bindCatalogTiles();
  bindLogout();
}

// Lazy-fetch RapidAPI covers for tiles that don't have an image yet.
async function loadRxCovers() {
  const tiles = document.querySelectorAll('[data-rx-cover]');
  for (const el of tiles) {
    try {
      const ref = JSON.parse(el.getAttribute('data-rx-cover'));
      if (!ref.id) continue;
      let d;
      if (ref.type === 'playlist') d = await window.cat.rxPlaylist(ref.id);
      else if (ref.type === 'artist')   d = await window.cat.rxArtist(ref.id);
      else if (ref.type === 'album')    d = await window.cat.rxAlbum(ref.id);
      const img = d?.img;
      if (img) el.style.backgroundImage = `url("${img}")`;
    } catch (e) { /* quota or 404, skip */ }
    await new Promise(r => setTimeout(r, 60));
  }
}

function sectionHTML(title, items, kind) {
  if (!items.length) return '';
  // kind = 'playlist' | 'artist' | 'album' — sets RapidAPI cover hint type
  const rxType = kind === 'artist' ? 'artist' : (kind === 'album' ? 'album' : 'playlist');
  return `<section class="section">
    <div class="section-head"><h2>${esc(title)}</h2><a href="explore.html">Show all</a></div>
    <div class="card-row">
      ${items.map(it => `
        <button class="card${kind === 'artist' ? ' artist' : ''}" data-cat-tile='${escAttr(JSON.stringify(it))}'>
          <div class="card-cover" data-rx-cover='${escAttr(JSON.stringify({type: rxType, id: it.id}))}' ${it.img ? `style="background-image:url(&quot;${it.img}&quot;)"` : ''}></div>
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.subtitle || '')}</p>
          <div class="card-fab"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></div>
        </button>`).join('')}
    </div>
  </section>`;
}

function trackCardRow(tracks) {
  return `<div class="card-row">
    ${tracks.map(t => `
      <button class="card" data-track-json='${escAttr(JSON.stringify(t))}'>
        <div class="card-cover" ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.artist || '')}</p>
        <div class="card-fab"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></div>
      </button>`).join('')}
  </div>`;
}

function cardSkel() {
  return `<div class="card" style="opacity:0.3"><div class="card-cover"></div><h3>&nbsp;</h3><p>&nbsp;</p></div>`;
}

// Fetch clean iTunes cover for a track title + artist (no JioSaavn watermarks)
const _coverCache = JSON.parse(sessionStorage.getItem('vs_itunes_covers') || '{}');
async function swapToCleanCover(pref, track) {
  const key = (track.title + '|' + (track.artist || '')).toLowerCase();
  let url = _coverCache[key];
  if (url === undefined) {
    try {
      const q = encodeURIComponent(`${track.title} ${track.artist || ''}`.trim());
      const r = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`);
      const j = await r.json();
      const art = j.results?.[0]?.artworkUrl100;
      url = art ? art.replace('100x100bb.jpg', '600x600bb.jpg') : '';
    } catch { url = ''; }
    _coverCache[key] = url;
    try { sessionStorage.setItem('vs_itunes_covers', JSON.stringify(_coverCache)); } catch {}
  }
  if (!url) return;
  const cards = document.querySelectorAll(`[data-track-json]`);
  cards.forEach(c => {
    try {
      const t = JSON.parse(c.getAttribute('data-track-json'));
      if (t.id === track.id) {
        const cover = c.querySelector('.card-cover');
        if (cover) cover.style.backgroundImage = `url("${url}")`;
      }
    } catch {}
  });
}

function bindCatalogTiles() {
  document.body.addEventListener('click', async (e) => {
    // Single track card → play that track only
    const trackCard = e.target.closest('[data-track-json]');
    if (trackCard && !e.target.closest('[data-cat-tile]')) {
      e.preventDefault();
      try {
        const t = JSON.parse(trackCard.getAttribute('data-track-json'));
        // Collect siblings as queue for next/prev
        const row = trackCard.closest('.card-row, .h-scroll');
        if (row && window.vsSetQueue) {
          const all = [...row.querySelectorAll('[data-track-json]')].map(c => {
            try { return JSON.parse(c.getAttribute('data-track-json')); } catch { return null; }
          }).filter(Boolean);
          const idx = all.findIndex(x => x.id === t.id);
          window.vsSetQueue(all, idx >= 0 ? idx : 0);
        } else if (window.vsAudio) {
          window.vsAudio.src = t.url;
          window.vsAudio.play();
          if (window.updateNowPlaying) window.updateNowPlaying(t);
          if (window.loadLyricsFor) window.loadLyricsFor(t);
        }
      } catch {}
      return;
    }

    // Playlist/album/artist tile → navigate to detail page
    const tile = e.target.closest('[data-cat-tile]');
    if (!tile) return;
    e.preventDefault();
    let item;
    try { item = JSON.parse(tile.getAttribute('data-cat-tile')); } catch { return; }
    const isFab = e.target.closest('.card-fab, .qp-fab');

    // Spotify-curated tiles (RapidAPI)
    if (item.id && item.type === 'rx-playlist') {
      if (isFab) {
        const p = await window.cat.rxPlaylist(item.id);
        if (p.tracks?.length) window.vsSetQueue(p.tracks, 0);
      } else {
        location.href = `playlist.html?id=${encodeURIComponent(item.id)}&src=rx`;
      }
      return;
    }
    if (item.id && item.type === 'rx-artist') {
      if (isFab) {
        const a = await window.cat.rxArtist(item.id);
        if (a.top_songs?.length) window.vsSetQueue(a.top_songs, 0);
      } else {
        location.href = `artist.html?id=${encodeURIComponent(item.id)}&src=rx`;
      }
      return;
    }
    if (item.id && item.type === 'rx-album') {
      if (isFab) {
        const a = await window.cat.rxAlbum(item.id);
        if (a.tracks?.length) window.vsSetQueue(a.tracks, 0);
      } else {
        location.href = `album.html?id=${encodeURIComponent(item.id)}&src=rx`;
      }
      return;
    }

    // JioSaavn fallback tiles
    if (item.id && (item.type === 'playlist' || item.type === 'chart')) {
      if (isFab) {
        const p = await window.cat.playlist(item.id);
        if (p.tracks?.length) window.vsSetQueue(p.tracks, 0);
      } else {
        location.href = `playlist.html?id=${encodeURIComponent(item.id)}&cover=${encodeURIComponent(item.img || '')}`;
      }
      return;
    }
    if (item.id && item.type === 'album') {
      if (isFab) {
        const a = await window.cat.album(item.id);
        if (a.tracks?.length) window.vsSetQueue(a.tracks, 0);
      } else {
        location.href = `album.html?id=${encodeURIComponent(item.id)}&cover=${encodeURIComponent(item.img || '')}`;
      }
      return;
    }
    if (item.query && window.searchAndPlay) window.searchAndPlay(item.query);
  });
}

function bindLogout() {
  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', () => {
    if (confirm('Log out + reset preferences?')) {
      ['vs_user', 'vs_prefs', 'vs_prefs_full'].forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      location.href = 'welcome.html';
    }
  });
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escAttr(s) { return String(s).replace(/'/g, '&#39;'); }
function cssEsc(s) { return CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'); }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
