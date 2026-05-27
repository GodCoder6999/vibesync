// VibeSync home — Soundbound-style aggregator.
// Pulls JioSaavn homepage (charts + playlists + new albums) + user-pref sections.
// Clicking any tile uses query-and-play via /api/search.

async function render() {
  try { await doRender(); }
  catch (e) {
    console.error('[home] fatal', e);
    const d = document.getElementById('dynSections');
    if (d) d.innerHTML = `<p style="padding:32px;color:#ff6b6b">Render error: ${e.message}. <a href="welcome.html" style="color:var(--accent)">Reset</a></p>`;
  }
}

async function doRender() {
  const prefs = JSON.parse(localStorage.getItem('vs_prefs') || '[]');
  const full = JSON.parse(localStorage.getItem('vs_prefs_full') || 'null');
  const user = JSON.parse(localStorage.getItem('vs_user') || '{}');

  // Greeting (Spotify-Clone homeScreen.dart pattern)
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = greeting;
  const ua = document.getElementById('userAvatar');
  if (ua) ua.textContent = (user.name || 'U')[0].toUpperCase();

  // Language from prefs (defaults Hindi+English if none picked)
  const langMap = { Hindi: 'hindi', English: 'english', Punjabi: 'punjabi', Tamil: 'tamil',
    Telugu: 'telugu', Bengali: 'bengali', Marathi: 'marathi', Gujarati: 'gujarati',
    Kannada: 'kannada', Malayalam: 'malayalam', Bhojpuri: 'bhojpuri' };
  const langs = (full?.languages || []).map(l => langMap[l]).filter(Boolean);
  const lang = langs.length ? langs.join(',') : 'hindi,english';

  // ----- Fetch JioSaavn home (Spotify direct catalog blocked from datacenter IPs) -----
  const home = await window.cat.home(lang).catch(e => { console.warn('home fail', e); return {}; });

  // SHORTCUTS: top 6 from charts + playlists (mix)
  const shortcuts = [
    ...(home.charts || []).slice(0, 3),
    ...(home.playlists || []).slice(0, 3),
  ].filter(Boolean).slice(0, 6);
  document.getElementById('shortcuts').innerHTML = shortcuts.map(s => `
    <button class="shortcut" data-cat-tile='${escAttr(JSON.stringify(s))}'>
      <div class="sc-cover" ${s.img ? `style="background-image:url(&quot;${s.img}&quot;)"` : ''}></div>
      <strong>${esc(s.title)}</strong>
      <div class="sc-fab"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></div>
    </button>`).join('');

  // SECTIONS in order: Charts, New Releases, Featured Playlists, then artist/genre rows
  const container = document.getElementById('dynSections');
  const sections = [];
  if (home.charts?.length)      sections.push({ title: "Today's Top Hits",  items: home.charts });
  if (home.new_albums?.length)  sections.push({ title: 'New Releases',       items: home.new_albums });
  if (home.playlists?.length)   sections.push({ title: 'Made For You',       items: home.playlists });

  // Render JioSaavn home sections (tiles open by search-and-play)
  container.innerHTML = sections.map(sec => `
    <section class="section">
      <div class="section-head"><h2>${esc(sec.title)}</h2><a href="#">Show all</a></div>
      <div class="h-scroll">
        ${sec.items.slice(0, 10).map(it => `
          <button class="card" data-cat-tile='${escAttr(JSON.stringify(it))}'>
            <div class="cover" ${it.img ? `style="background-image:url(&quot;${it.img}&quot;)"` : ''}></div>
            <h3>${esc(it.title)}</h3>
            <p>${esc(it.subtitle || '')}</p>
            <div class="play-fab"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></div>
          </button>`).join('')}
      </div>
    </section>`).join('');

  // ----- User-pref sections (artists + genres) using real /api/search -----
  const artists = full?.artists || [];
  const genres = full?.genres || prefs.filter(p => !artists.includes(p));
  const ordered = [...artists, ...genres].slice(0, 5);
  if (ordered.length) {
    container.innerHTML += ordered.map(p => `
      <section class="section" data-pref="${escAttr(p)}">
        <div class="section-head"><h2>${esc(p + ' Mix')}</h2><a href="#">Show all</a></div>
        <div class="h-scroll skel">${'<div class="card" style="opacity:0.3;flex:0 0 180px"><div class="cover"></div><h3>&nbsp;</h3><p>&nbsp;</p></div>'.repeat(5)}</div>
      </section>`).join('');

    await Promise.all(ordered.map(async (p) => {
      const data = await window.cat.search(p, 6);
      const sec = container.querySelector(`[data-pref="${cssEsc(p)}"]`);
      if (!sec) return;
      const tracks = data.results || [];
      sec.querySelector('.h-scroll').outerHTML = `
        <div class="h-scroll">${tracks.map(t => `
          <button class="card" data-track-json='${escAttr(JSON.stringify(t))}'>
            <div class="cover" ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
            <h3>${esc(t.title)}</h3>
            <p>${esc(t.artist || '')}</p>
            <div class="play-fab"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></div>
          </button>`).join('')}
        </div>`;
    }));
  }

  bindCatalogTiles();
  bindLogout();
}

// ----- Click handlers -----
function bindCatalogTiles() {
  document.body.addEventListener('click', async (e) => {
    const tile = e.target.closest('[data-cat-tile]');
    if (!tile) return;
    e.preventDefault();
    let item;
    try { item = JSON.parse(tile.getAttribute('data-cat-tile')); } catch { return; }
    // Try to fetch tracks for playlist/album, else fall back to search-and-play first match
    try {
      let firstTitle = null;
      let firstArtist = null;
      if (item.type === 'sp-playlist') {
        const p = await window.cat.spPlaylist(item.id);
        const t = (p.tracks || [])[0];
        if (t) { firstTitle = t.title; firstArtist = t.subtitle; }
      } else if (item.type === 'sp-album') {
        const a = await window.cat.spAlbum(item.id);
        const t = (a.tracks || [])[0];
        if (t) { firstTitle = t.title; firstArtist = t.subtitle; }
      } else if (item.type === 'sp-track') {
        firstTitle = item.title; firstArtist = item.subtitle;
      } else if (item.type === 'playlist' && item.id) {
        const p = await window.cat.playlist(item.id);
        const tr = (p.tracks || [])[0];
        if (tr && window.vsAudio) {
          window.vsAudio.src = tr.url; window.vsAudio.play();
          if (window.updateNowPlaying) window.updateNowPlaying(tr);
          return;
        }
      } else if (item.type === 'album' && item.id) {
        const a = await window.cat.album(item.id);
        const tr = (a.tracks || [])[0];
        if (tr && window.vsAudio) {
          window.vsAudio.src = tr.url; window.vsAudio.play();
          if (window.updateNowPlaying) window.updateNowPlaying(tr);
          return;
        }
      } else if (item.type === 'chart' && item.id) {
        const p = await window.cat.playlist(item.id);
        const tr = (p.tracks || [])[0];
        if (tr && window.vsAudio) {
          window.vsAudio.src = tr.url; window.vsAudio.play();
          if (window.updateNowPlaying) window.updateNowPlaying(tr);
          return;
        }
      }
      // Soundbound bridge: Spotify metadata → JioSaavn audio resolution
      if (firstTitle && window.searchAndPlay) {
        return window.searchAndPlay(`${firstTitle} ${firstArtist || ''}`.trim());
      }
    } catch (err) { console.warn('tile fetch fail', err); }
    // Fallback: search by tile.query
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
