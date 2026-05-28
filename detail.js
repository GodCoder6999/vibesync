// VibeSync detail page renderer for playlist / album / artist.
// Reads ?id= or ?name= from URL, fetches via /api/playlist|album|artist, renders Spotify-style hero + tracks.

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escAttr(s) { return String(s).replace(/'/g, '&#39;'); }
function fmt(s) { if (!s) return '0:00'; const m = Math.floor(s/60), sec = String(Math.floor(s%60)).padStart(2,'0'); return `${m}:${sec}`; }
function fmtTotal(secs) {
  if (!secs) return '0 min';
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60);
  return h ? `${h} hr ${m} min` : `${m} min`;
}

async function renderDetail(type) {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const name = params.get('name');
  const cover = params.get('cover') || '';

  const content = document.getElementById('content');
  content.innerHTML = `<div style="padding:80px 24px;color:var(--text-muted)">Loading…</div>`;

  try {
    let data;
    if (type === 'playlist') data = await window.cat.playlist(id);
    else if (type === 'album') data = await window.cat.album(id);
    else if (type === 'artist') data = await window.cat.artist(id ? { id } : { name });
    if (!data || data.error) throw new Error(data?.error || 'No data');

    if (type === 'artist') renderArtist(content, data);
    else renderPlaylistOrAlbum(content, type, data, cover);
  } catch (e) {
    content.innerHTML = `<div style="padding:80px 24px;color:#ff6b6b">Failed to load: ${esc(e.message)}</div>`;
  }
}

function renderPlaylistOrAlbum(content, type, data, fallbackCover) {
  const img = data.img || fallbackCover || '';
  const tracks = data.tracks || [];
  const totalSec = tracks.reduce((s, t) => s + (t.duration || 0), 0);
  const heroColor = pickHeroColor(data.title || '');

  content.innerHTML = `
    <div class="page-hero" style="--hero-color:${heroColor}">
      <div class="page-hero-inner">
        <div class="page-hero-art" ${img ? `style="background-image:url(&quot;${img}&quot;)"` : ''}></div>
        <div class="page-hero-info">
          <div class="type">${type === 'album' ? 'Album' : 'Playlist'}</div>
          <h1>${esc(data.title || 'Untitled')}</h1>
          <div class="meta">
            <strong>${esc(data.subtitle || (type === 'album' ? data.year || '' : 'VibeSync'))}</strong>
            ${tracks.length ? `<span class="meta-dot"></span><span>${tracks.length} song${tracks.length===1?'':'s'}, ${fmtTotal(totalSec)}</span>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="action-bar">
      <button class="play-big" id="playAll"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></button>
      <button class="ab-icon" aria-label="Shuffle"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"/></svg></button>
      <button class="ab-icon" aria-label="More"><svg viewBox="0 0 16 16" fill="currentColor"><circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="14" cy="8" r="1.5"/></svg></button>
    </div>

    <div class="song-table">
      <div class="row head">
        <div class="num">#</div>
        <div>Title</div>
        <div>Album</div>
        <div>Plays</div>
        <div class="duration">⏱</div>
      </div>
      ${tracks.map((t, i) => `
        <button class="row" data-idx="${i}">
          <div class="num">${i+1}</div>
          <div class="title-cell">
            <div class="row-cover" ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
            <div class="title-text"><strong>${esc(t.title)}</strong><span>${esc(t.artist || '')}</span></div>
          </div>
          <div>${esc(t.album || data.title || '')}</div>
          <div></div>
          <div class="duration">${fmt(t.duration)}</div>
        </button>`).join('')}
    </div>`;

  // Bind clicks: row → play at index; Play All → start queue at 0
  content.querySelectorAll('.row[data-idx]').forEach(r => {
    r.addEventListener('click', () => {
      const i = parseInt(r.dataset.idx, 10);
      if (window.vsSetQueue) window.vsSetQueue(tracks, i);
    });
  });
  document.getElementById('playAll').addEventListener('click', () => {
    if (window.vsSetQueue) window.vsSetQueue(tracks, 0);
  });
}

async function renderArtist(content, data) {
  const tracks = data.top_songs || [];
  const albums = data.albums || [];
  const heroColor = pickHeroColor(data.name || '');

  content.innerHTML = `
    <div class="page-hero" style="--hero-color:${heroColor};padding:40px 24px;padding-top:160px;min-height:340px">
      <div class="page-hero-info" style="padding-left:0">
        <div class="type" style="display:flex;align-items:center;gap:6px;color:#fff"><svg width="20" height="20" viewBox="0 0 24 24" fill="#4cb3ff"><path d="M10.814.5a1.658 1.658 0 0 1 2.372 0l2.512 2.572 3.595-.043a1.658 1.658 0 0 1 1.678 1.678l-.043 3.595L23.5 10.814a1.658 1.658 0 0 1 0 2.372l-2.572 2.512.043 3.595a1.658 1.658 0 0 1-1.678 1.678l-3.595-.043-2.512 2.572a1.658 1.658 0 0 1-2.372 0l-2.512-2.572-3.595.043a1.658 1.658 0 0 1-1.678-1.678l.043-3.595L.5 13.186a1.658 1.658 0 0 1 0-2.372l2.572-2.512-.043-3.595a1.658 1.658 0 0 1 1.678-1.678l3.595.043L10.814.5z"/><path d="M16.726 9.32a.75.75 0 1 0-1.06-1.06l-5.069 5.07-1.834-1.834a.75.75 0 1 0-1.06 1.06l2.894 2.895 6.13-6.13z" fill="#fff"/></svg> Verified Artist</div>
        <h1>${esc(data.name || 'Artist')}</h1>
        <div class="meta" style="color:rgba(255,255,255,0.85)">
          <span>${(data.follower_count || 0).toLocaleString()} monthly listeners</span>
        </div>
      </div>
      ${data.img ? `<div style="position:absolute;inset:0;z-index:-1;background:url(&quot;${data.img}&quot;) center/cover;opacity:0.6"></div>` : ''}
    </div>

    <div class="action-bar">
      <button class="play-big" id="playAll"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></button>
      <button class="follow-btn">Follow</button>
      <button class="ab-icon"><svg viewBox="0 0 16 16" fill="currentColor"><circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="14" cy="8" r="1.5"/></svg></button>
    </div>

    <section class="section">
      <div class="section-head"><h2>Popular</h2></div>
      <div class="song-table">
        ${tracks.slice(0, 5).map((t, i) => `
          <button class="row" data-idx="${i}">
            <div class="num">${i+1}</div>
            <div class="title-cell">
              <div class="row-cover" ${t.img ? `style="background-image:url(&quot;${t.img}&quot;)"` : ''}></div>
              <div class="title-text"><strong>${esc(t.title)}</strong></div>
            </div>
            <div>${esc(t.album || '')}</div>
            <div></div>
            <div class="duration">${fmt(t.duration)}</div>
          </button>`).join('')}
      </div>
    </section>

    ${albums.length ? `
    <section class="section">
      <div class="section-head"><h2>Discography</h2><a href="#">Show all</a></div>
      <div class="card-row">
        ${albums.map(a => `
          <a class="card" href="album.html?id=${encodeURIComponent(a.id)}">
            <div class="card-cover" ${a.img ? `style="background-image:url(&quot;${a.img}&quot;)"` : ''}></div>
            <h3>${esc(a.title)}</h3>
            <p>${esc(a.subtitle || 'Album')}</p>
            <div class="card-fab"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg></div>
          </a>`).join('')}
      </div>
    </section>` : ''}`;

  content.querySelectorAll('.row[data-idx]').forEach(r => {
    r.addEventListener('click', () => {
      const i = parseInt(r.dataset.idx, 10);
      if (window.vsSetQueue) window.vsSetQueue(tracks, i);
    });
  });
  const playAll = document.getElementById('playAll');
  if (playAll) playAll.addEventListener('click', () => {
    if (window.vsSetQueue && tracks.length) window.vsSetQueue(tracks, 0);
  });
}

function pickHeroColor(str) {
  const colors = ['#535353', '#1E3264', '#477D95', '#8D67AB', '#E61E32', '#BA5D07', '#503751', '#006450', '#777777', '#DC148C', '#5B5752', '#608108'];
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}
