// Personalized home: fetches real tracks per pref from /api/search.
// No hard-coded catalog — works with any artist/genre selected in onboarding.

const PREF_LIMIT = 6;       // max sections shown
const SONGS_PER_SECTION = 5;

async function fetchSection(query, limit = SONGS_PER_SECTION) {
  const cacheKey = 'vs_section_' + query;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }
  try {
    const r = await fetch('/api/search?q=' + encodeURIComponent(query) + '&limit=' + limit);
    if (!r.ok) return [];
    const j = await r.json();
    const results = (j.results || []).slice(0, limit);
    sessionStorage.setItem(cacheKey, JSON.stringify(results));
    return results;
  } catch (e) {
    console.warn('section fetch fail', query, e);
    return [];
  }
}

function sectionHTML(title, tracks) {
  if (!tracks.length) return '';
  return `
    <section class="section">
      <div class="section-head">
        <h2>${esc(title)}</h2>
        <a href="#">Show all</a>
      </div>
      <div class="h-scroll">
        ${tracks.map(t => `
          <button class="card" data-track-json='${escAttr(JSON.stringify({ ...t, id: 'jio-' + t.id }))}'>
            <div class="cover" ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
            <h3>${esc(t.title)}</h3>
            <p>${esc(t.artist || t.album || '')}</p>
            <div class="play-fab">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>
            </div>
          </button>`).join('')}
      </div>
    </section>`;
}

function shortcutsHTML(tracks) {
  return tracks.slice(0, 6).map(t => `
    <button class="shortcut" data-track-json='${escAttr(JSON.stringify({ ...t, id: 'jio-' + t.id }))}'>
      <div class="sc-cover" ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
      <strong>${esc(t.title)}</strong>
      <div class="sc-fab">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8V4z"/></svg>
      </div>
    </button>`).join('');
}

const DEFAULT_PREFS = ['Arijit Singh', 'Imagine Dragons', 'AP Dhillon', 'Bollywood', 'Pop', 'Indie'];

async function render() {
  try {
    await doRender();
  } catch (e) {
    console.error('[home] render fatal', e);
    const d = document.getElementById('dynSections');
    if (d) d.innerHTML = `<p style="padding:32px;color:#ff6b6b">Render error: ${e.message}. <a href="welcome.html" style="color:var(--accent)">Reset</a>.</p>`;
  }
}

async function doRender() {
  const prefs = JSON.parse(localStorage.getItem('vs_prefs') || '[]');
  const full = JSON.parse(localStorage.getItem('vs_prefs_full') || 'null');
  const user = JSON.parse(localStorage.getItem('vs_user') || '{}');
  const spUser = JSON.parse(localStorage.getItem('vs_sp_user') || 'null');

  // Greeting (matches Spotify-Clone homeScreen.dart line 50)
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = greeting;
  const ua = document.getElementById('userAvatar');
  if (ua) {
    if (spUser?.image) {
      ua.style.backgroundImage = `url("${spUser.image}")`;
      ua.style.backgroundSize = 'cover';
      ua.textContent = '';
    } else {
      ua.textContent = (user.name || 'U')[0].toUpperCase();
    }
  }

  // If Spotify connected, render real Spotify home + return
  if (window.isSpotifyConnected && window.isSpotifyConnected()) {
    try { return await renderSpotifyHome(); }
    catch (e) { console.warn('[home] spotify render failed, falling back', e); }
  }

  // Pick order: artists first, then genres. Fall back to defaults so home never blank.
  const artists = full?.artists || [];
  const genres = full?.genres || prefs.filter(p => !artists.includes(p));
  let ordered = [...artists, ...genres].slice(0, PREF_LIMIT);
  if (!ordered.length) ordered = DEFAULT_PREFS;
  console.log('[home] rendering prefs:', ordered);

  // Fetch first track of each pref for shortcuts (in parallel)
  const firstTracks = await Promise.all(ordered.map(p => fetchSection(p, 1).then(arr => arr[0]).catch(() => null)));
  document.getElementById('shortcuts').innerHTML = shortcutsHTML(firstTracks.filter(Boolean));

  // Render sections progressively
  const container = document.getElementById('dynSections');
  container.innerHTML = ordered.map(p =>
    `<section class="section" data-pref="${escAttr(p)}">
      <div class="section-head"><h2>${esc(p)}</h2><a href="#">Show all</a></div>
      <div class="h-scroll skel">${'<div class="card" style="opacity:0.4;flex:0 0 180px"><div class="cover"></div><h3>&nbsp;</h3><p>&nbsp;</p></div>'.repeat(5)}</div>
    </section>`
  ).join('');

  await Promise.all(ordered.map(async (p) => {
    const tracks = await fetchSection(p);
    const sec = container.querySelector(`[data-pref="${cssEsc(p)}"]`);
    if (sec) {
      sec.innerHTML = sectionHTML(p, tracks).replace(/^<section[^>]*>|<\/section>$/g, '');
    }
  }));

  // Logout
  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', () => {
    if (confirm('Log out and reset preferences?')) {
      localStorage.removeItem('vs_user');
      localStorage.removeItem('vs_prefs');
      localStorage.removeItem('vs_prefs_full');
      sessionStorage.clear();
      location.href = 'welcome.html';
    }
  });
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escAttr(s) { return String(s).replace(/'/g, '&#39;'); }
function cssEsc(s) { return CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'); }

// ---------- Spotify home (when connected) ----------
async function renderSpotifyHome() {
  const sp = window.sp;
  const [recent, top, playlists, newRel, featured] = await Promise.all([
    sp.recent().catch(() => null),
    sp.topTracks().catch(() => null),
    sp.playlists().catch(() => null),
    sp.newReleases().catch(() => null),
    sp.featured().catch(() => null)
  ]);

  // Shortcuts: top 6 from recent or playlists
  const shortTracks = [];
  if (recent?.items) for (const it of recent.items.slice(0, 6)) shortTracks.push(spotifyTrackToTrack(it.track));
  if (playlists?.items && shortTracks.length < 6) {
    for (const p of playlists.items.slice(0, 6 - shortTracks.length)) {
      shortTracks.push({ title: p.name, artist: 'Playlist', img: p.images?.[0]?.url || '', _spotifyPlaylist: p.id });
    }
  }
  document.getElementById('shortcuts').innerHTML = shortTracks.map(t => `
    <button class="shortcut" data-sp-bridge='${escAttr(JSON.stringify(t))}'>
      <div class="sc-cover" ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
      <strong>${esc(t.title)}</strong>
      <div class="sc-fab"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8V4z"/></svg></div>
    </button>`).join('');

  const sections = [];
  if (top?.items)         sections.push(['Made For You', top.items.map(spotifyTrackToTrack)]);
  if (recent?.items)      sections.push(['Recently Played', recent.items.map(it => spotifyTrackToTrack(it.track))]);
  if (newRel?.albums?.items) sections.push(['New Releases', newRel.albums.items.map(spotifyAlbumToTrack)]);
  if (featured?.playlists?.items) sections.push(['Featured Playlists', featured.playlists.items.map(spotifyPlaylistToCard)]);
  if (playlists?.items)   sections.push(['Your Playlists', playlists.items.map(spotifyPlaylistToCard)]);

  document.getElementById('dynSections').innerHTML = sections.map(([title, tracks]) => `
    <section class="section">
      <div class="section-head"><h2>${esc(title)}</h2><a href="#">Show all</a></div>
      <div class="h-scroll">
        ${tracks.slice(0, 10).map(t => `
          <button class="card" data-sp-bridge='${escAttr(JSON.stringify(t))}'>
            <div class="cover" ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
            <h3>${esc(t.title)}</h3>
            <p>${esc(t.artist || '')}</p>
            <div class="play-fab"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></div>
          </button>`).join('')}
      </div>
    </section>`).join('');

  bindSpotifyBridge();
  bindLogout();
}

function spotifyTrackToTrack(t) {
  if (!t) return null;
  return {
    title: t.name,
    artist: (t.artists || []).map(a => a.name).join(', '),
    img: t.album?.images?.[0]?.url || '',
    _spotifyId: t.id
  };
}
function spotifyAlbumToTrack(a) {
  return {
    title: a.name,
    artist: (a.artists || []).map(x => x.name).join(', '),
    img: a.images?.[0]?.url || '',
    _spotifyAlbum: a.id
  };
}
function spotifyPlaylistToCard(p) {
  return {
    title: p.name,
    artist: p.description || ('By ' + (p.owner?.display_name || '')),
    img: p.images?.[0]?.url || '',
    _spotifyPlaylist: p.id
  };
}

function bindSpotifyBridge() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sp-bridge]');
    if (!btn) return;
    e.preventDefault();
    try {
      const t = JSON.parse(btn.getAttribute('data-sp-bridge'));
      const q = `${t.title} ${t.artist || ''}`.trim();
      if (window.searchAndPlay) window.searchAndPlay(q);
      else fetch('/api/search?q=' + encodeURIComponent(q) + '&limit=1')
        .then(r => r.json()).then(j => {
          if (j.results?.[0] && window.vsAudio) {
            window.vsAudio.src = j.results[0].url;
            window.vsAudio.play();
          }
        });
    } catch (err) { console.error(err); }
  });
}

function bindLogout() {
  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', () => {
    if (confirm('Log out + reset everything?')) {
      ['vs_user', 'vs_prefs', 'vs_prefs_full', 'vs_sp_token', 'vs_sp_refresh', 'vs_sp_expiry', 'vs_sp_user']
        .forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      location.href = 'welcome.html';
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
