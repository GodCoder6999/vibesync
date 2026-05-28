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

  // Language for JioSaavn home
  const langMap = { Hindi: 'hindi', English: 'english', Punjabi: 'punjabi', Tamil: 'tamil',
    Telugu: 'telugu', Bengali: 'bengali', Marathi: 'marathi', Gujarati: 'gujarati',
    Kannada: 'kannada', Malayalam: 'malayalam', Bhojpuri: 'bhojpuri' };
  const langs = (full?.languages || []).map(l => langMap[l]).filter(Boolean);
  const lang = langs.length ? langs.join(',') : 'hindi,english';

  const home = await window.cat.home(lang).catch(e => { console.warn('home fail', e); return {}; });

  // ---- Quick-pick tiles (top 6) ----
  const quick = [
    ...(home.charts || []).slice(0, 3),
    ...(home.playlists || []).slice(0, 3),
  ].filter(Boolean).slice(0, 6);
  document.getElementById('quickPicks').innerHTML = quick.map(t => `
    <button class="qp-tile" data-cat-tile='${escAttr(JSON.stringify(t))}'>
      <div class="qp-cover" ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
      <strong>${esc(t.title)}</strong>
      <div class="qp-fab"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></div>
    </button>`).join('');

  // ---- Sections ----
  const container = document.getElementById('dynSections');
  const sections = [];
  if (home.charts?.length)      sections.push({ title: 'Made For You',        items: home.charts });
  if (home.new_albums?.length)  sections.push({ title: 'New Releases',        items: home.new_albums });
  if (home.playlists?.length)   sections.push({ title: 'Popular Playlists',   items: home.playlists });

  container.innerHTML = sections.map(sec => sectionHTML(sec.title, sec.items.slice(0, 8))).join('');

  // ---- User-pref rows ----
  const artists = full?.artists || [];
  const genres = full?.genres || prefs.filter(p => !artists.includes(p));
  const ordered = [...artists, ...genres].slice(0, 5);
  if (ordered.length) {
    container.innerHTML += ordered.map(p => `
      <section class="section" data-pref="${escAttr(p)}">
        <div class="section-head"><h2>${esc(p)} Mix</h2><a href="#">Show all</a></div>
        <div class="card-row skel">${cardSkel().repeat(6)}</div>
      </section>`).join('');

    await Promise.all(ordered.map(async (p) => {
      const data = await window.cat.search(p, 8);
      const sec = container.querySelector(`[data-pref="${cssEsc(p)}"] .card-row`);
      if (!sec) return;
      sec.outerHTML = trackCardRow(data.results || []);
    }));
  }

  bindCatalogTiles();
  bindLogout();
}

function sectionHTML(title, items) {
  if (!items.length) return '';
  return `<section class="section">
    <div class="section-head"><h2>${esc(title)}</h2><a href="#">Show all</a></div>
    <div class="card-row">
      ${items.map(it => `
        <button class="card" data-cat-tile='${escAttr(JSON.stringify(it))}'>
          <div class="card-cover" ${it.img ? `style="background-image:url(&quot;${it.img}&quot;)"` : ''}></div>
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

function bindCatalogTiles() {
  document.body.addEventListener('click', async (e) => {
    const tile = e.target.closest('[data-cat-tile]');
    if (!tile) return;
    e.preventDefault();
    let item;
    try { item = JSON.parse(tile.getAttribute('data-cat-tile')); } catch { return; }
    try {
      let track = null;
      if ((item.type === 'playlist' || item.type === 'chart') && item.id) {
        const p = await window.cat.playlist(item.id);
        track = (p.tracks || [])[0];
      } else if (item.type === 'album' && item.id) {
        const a = await window.cat.album(item.id);
        track = (a.tracks || [])[0];
      }
      if (track && window.vsAudio) {
        window.vsAudio.src = track.url;
        window.vsAudio.play();
        if (window.updateNowPlaying) window.updateNowPlaying(track);
        if (window.loadLyricsFor) window.loadLyricsFor(track);
        return;
      }
    } catch (err) { console.warn('tile fetch fail', err); }
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
