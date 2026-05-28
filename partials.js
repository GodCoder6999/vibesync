// Spotify-clone chrome: sidebar (library) + miniplayer (PlayingBar) + now-overlay.

const ICON = {
  homeActive: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 1.515a3 3 0 0 0-3 0L3 5.845a2 2 0 0 0-1 1.732V21a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6h4v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.577a2 2 0 0 0-1-1.732l-7.5-4.33z"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.533 1.279c-5.18 0-9.407 4.14-9.407 9.279s4.226 9.279 9.407 9.279c2.234 0 4.29-.77 5.907-2.058l4.353 4.353a1 1 0 1 0 1.414-1.414l-4.344-4.344a9.157 9.157 0 0 0 2.077-5.816c0-5.14-4.226-9.28-9.407-9.28zm-7.407 9.279c0-4.006 3.302-7.28 7.407-7.28s7.407 3.274 7.407 7.28-3.302 7.279-7.407 7.279-7.407-3.273-7.407-7.28z"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2.134a1 1 0 0 1 1 0l6 3.464a1 1 0 0 1 .5.866V21a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V2.134zM16 4.732V20h4V7.041l-4-2.309zM3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zm6 0a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1z"/></svg>',
  plus: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M15.25 8a.75.75 0 0 1-.75.75H8.75v5.75a.75.75 0 0 1-1.5 0V8.75H1.5a.75.75 0 0 1 0-1.5h5.75V1.5a.75.75 0 0 1 1.5 0v5.75h5.75a.75.75 0 0 1 .75.75z"/></svg>',
  arrL: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.03.47a.75.75 0 0 1 0 1.06L4.56 8l6.47 6.47a.75.75 0 1 1-1.06 1.06L2.44 8 9.97.47a.75.75 0 0 1 1.06 0z"/></svg>',
  arrR: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.97.47a.75.75 0 0 0 0 1.06L11.44 8l-6.47 6.47a.75.75 0 1 0 1.06 1.06L13.56 8 6.03.47a.75.75 0 0 0-1.06 0z"/></svg>',
  searchSm: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 1.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5zM.25 7a6.75 6.75 0 1 1 12.096 4.12l3.184 3.185a.75.75 0 1 1-1.06 1.06L11.304 12.2A6.75 6.75 0 0 1 .25 7z"/></svg>',
  bell: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v3.5L2 11h12l-1.5-1.5V6A4.5 4.5 0 0 0 8 1.5zm-1.5 12a1.5 1.5 0 1 0 3 0h-3z"/></svg>',
  install: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.75 1a.75.75 0 0 1 .75.75v9.69l1.97-1.97a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06l1.97 1.97V1.75a.75.75 0 0 1 .75-.75z"/></svg>',
  play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>',
  pause: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"/></svg>',
  prev: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.606L4 9.149V14.3a.7.7 0 0 1-1.4 0V1.7a.7.7 0 0 1 .7-.7z"/></svg>',
  next: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 1.4 0V1.7a.7.7 0 0 0-.7-.7z"/></svg>',
  shuffle: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"/><path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34l-.787-.937z"/></svg>',
  repeat: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"/></svg>',
  heart: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-.605-.463L1.348 8.309A4.582 4.582 0 0 1 1.689 2zm3.158.252A3.082 3.082 0 0 0 2.49 7.337l.005.005L7.8 13.664a.264.264 0 0 0 .311.069.262.262 0 0 0 .09-.069l5.312-6.33a3.043 3.043 0 0 0 .68-2.573 3.118 3.118 0 0 0-2.551-2.463 3.079 3.079 0 0 0-2.612.816l-.007.007a1.501 1.501 0 0 1-2.045 0l-.009-.008a3.082 3.082 0 0 0-2.121-.861z"/></svg>',
  heartFill: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.578z"/></svg>',
  pip: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.196 8 6 5v6z"/><path d="M15.002 1.75A1.75 1.75 0 0 0 13.252 0h-10.5a1.75 1.75 0 0 0-1.75 1.75v12.5c0 .966.784 1.75 1.75 1.75h10.5a1.75 1.75 0 0 0 1.75-1.75V1.75zm-1.75-.25a.25.25 0 0 1 .25.25v12.5a.25.25 0 0 1-.25.25h-10.5a.25.25 0 0 1-.25-.25V1.75a.25.25 0 0 1 .25-.25h10.5z"/></svg>',
  queue: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-7A2.5 2.5 0 0 1 3.5 1h9a2.5 2.5 0 0 1 0 5h-9A2.5 2.5 0 0 1 1 3.5zm2.5-1a1 1 0 0 0 0 2h9a1 1 0 1 0 0-2h-9z"/></svg>',
  devices: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25V2.75zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25h-6.5z"/><path d="M4 7H1.75a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25H4V14.5H1.75A1.75 1.75 0 0 1 0 12.75v-5.5C0 6.284.784 5.5 1.75 5.5H4V7z"/></svg>',
  speaker: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 0 1 0 4.88z"/><path d="M11.5 13.614a5.752 5.752 0 0 0 0-11.228v1.55a4.252 4.252 0 0 1 0 8.127v1.55z"/></svg>',
  mic: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.426 2.574a2.831 2.831 0 0 0-4.797 1.55l3.247 3.247a2.831 2.831 0 0 0 1.55-4.797zM10.5 8.118l-2.619-2.62A63303.13 63303.13 0 0 0 4.74 9.075L2.065 12.12a1.287 1.287 0 0 0 1.816 1.816l3.06-2.688 3.56-3.129zM7.12 4.094a4.331 4.331 0 1 1 4.786 4.786l-3.974 3.493-3.06 2.689a2.787 2.787 0 0 1-3.933-3.933l2.676-3.045 3.505-3.99z"/></svg>',
  collapse: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 15h12.5a.5.5 0 0 0 0-1H2a.5.5 0 0 0 0 1zM2 2h12.5a.5.5 0 0 0 0-1H2a.5.5 0 0 0 0 1zm-.354 5.354 2.5 2.5a.5.5 0 0 0 .708-.708L3.207 8H14.5a.5.5 0 0 0 0-1H3.207l1.647-1.646a.5.5 0 1 0-.708-.708l-2.5 2.5a.5.5 0 0 0 0 .708z"/></svg>',
  more: '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="14" cy="8" r="1.5"/></svg>',
  close: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.47 2.47a.75.75 0 0 1 1.06 0L8 6.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L9.06 8l4.47 4.47a.75.75 0 1 1-1.06 1.06L8 9.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L6.94 8 2.47 3.53a.75.75 0 0 1 0-1.06z"/></svg>',
};

const SIDEBAR = (active) => `
<aside class="sidebar">
  <!-- Top nav -->
  <div class="sb-top">
    <a href="index.html" class="sb-nav-item ${active==='home'?'active':''}">
      ${active==='home' ? ICON.homeActive : ICON.home} Home
    </a>
    <a href="explore.html" class="sb-nav-item ${active==='explore'?'active':''}">
      ${ICON.search} Search
    </a>
  </div>

  <!-- Library section -->
  <div class="sb-library">
    <div class="sb-lib-head">
      <div class="lib-title">${ICON.library} Your Library</div>
      <button class="icon-btn" aria-label="Create">${ICON.plus}</button>
    </div>
    <div class="sb-chips">
      <button class="sb-chip active">Playlists</button>
      <button class="sb-chip">Albums</button>
      <button class="sb-chip">Artists</button>
      <button class="sb-chip">Podcasts</button>
    </div>
    <div class="sb-search-row">${ICON.searchSm}</div>
    <div class="sb-list" id="sbList">
      ${sbItem('playlist', 'Liked Songs', 'Playlist · 12 songs', '#1ED760')}
      ${sbItem('playlist', 'Today\\'s Top Hits', 'Playlist · VibeSync')}
      ${sbItem('playlist', 'New Releases', 'Playlist · JioSaavn')}
      ${sbItem('artist', 'Arijit Singh', 'Artist')}
      ${sbItem('artist', 'The Weeknd', 'Artist')}
      ${sbItem('album', 'Brahmastra', 'Album · Pritam')}
    </div>
  </div>
</aside>`;

function sbItem(kind, title, sub, color) {
  const style = color ? `style="background:${color}"` : '';
  return `<div class="sb-item ${kind}">
    <div class="sb-item-cover" ${style}></div>
    <div class="sb-item-meta"><strong>${title}</strong><span>${sub}</span></div>
  </div>`;
}

const MINIPLAYER = `
<div class="miniplayer">
  <div class="mp-track">
    <div class="mp-cover" data-np-cover></div>
    <div class="mp-meta">
      <strong data-np-title>Pick a song</strong>
      <span data-np-artist>VibeSync</span>
    </div>
    <button class="mp-btn mp-icon mp-like" aria-label="Like">${ICON.heart}</button>
  </div>

  <div class="mp-center">
    <div class="mp-controls">
      <button class="mp-btn" aria-label="Shuffle">${ICON.shuffle}</button>
      <button class="mp-btn" aria-label="Previous">${ICON.prev}</button>
      <button class="mp-btn mp-play" data-play-toggle data-play-icon aria-label="Play">${ICON.play}</button>
      <button class="mp-btn" aria-label="Next">${ICON.next}</button>
      <button class="mp-btn" aria-label="Repeat">${ICON.repeat}</button>
    </div>
    <div class="mp-bar-wrap">
      <span data-current-time class="mp-time">0:00</span>
      <div class="mp-bar" data-seek><div data-progress-fill></div></div>
      <span data-duration class="mp-time">0:00</span>
    </div>
  </div>

  <div class="mp-right">
    <button class="mp-btn" aria-label="Now Playing View">${ICON.mic}</button>
    <button class="mp-btn" aria-label="Queue">${ICON.queue}</button>
    <button class="mp-btn" aria-label="Connect to a device">${ICON.devices}</button>
    <button class="mp-btn" aria-label="Volume" id="mpMute">${ICON.speaker}</button>
    <div class="mp-volume" data-volume><div></div></div>
    <button class="mp-btn" aria-label="Full screen">${ICON.pip}</button>
  </div>
</div>`;

const NOW_OVERLAY = `
<div class="now-overlay" id="nowOverlay">
  <button class="now-close" id="nowClose">${ICON.close}</button>
  <div class="now-stage">
    <div class="now-art" data-np-cover></div>
    <div class="now-info">
      <div>
        <h1 data-np-title>No track</h1>
        <div class="artist" data-np-artist>Search or pick a card</div>
      </div>
      <div class="now-progress">
        <div class="bar" data-seek><div data-progress-fill></div></div>
        <div class="times"><span data-current-time>0:00</span><span data-duration>0:00</span></div>
      </div>
      <div class="now-controls">
        <button class="ctrl">${ICON.shuffle}</button>
        <button class="ctrl">${ICON.prev}</button>
        <button class="ctrl play-big" data-play-toggle data-play-icon>${ICON.play}</button>
        <button class="ctrl">${ICON.next}</button>
        <button class="ctrl">${ICON.repeat}</button>
      </div>
      <div class="now-lyrics" id="nowLyrics"><div data-lyrics-content style="font-size:14px;color:var(--text-muted);font-weight:400">Play a song to load lyrics</div></div>
    </div>
  </div>
</div>`;

function mountChrome(active) {
  document.getElementById('chrome-sidebar').innerHTML = SIDEBAR(active);
  document.getElementById('chrome-mini').innerHTML = MINIPLAYER + NOW_OVERLAY;

  document.addEventListener('click', (e) => {
    if (e.target.closest('.mp-cover') || e.target.closest('.mp-meta strong')) {
      document.getElementById('nowOverlay').classList.add('open');
    }
    if (e.target.closest('#nowClose')) {
      document.getElementById('nowOverlay').classList.remove('open');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.getElementById('nowOverlay')?.classList.remove('open');
  });
}

window.ICON = ICON;
