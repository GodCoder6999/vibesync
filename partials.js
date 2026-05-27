// Shared sidebar + miniplayer markup injected via JS so 4 pages stay in sync.
const SIDEBAR = (active) => `
<aside class="sidebar">
  <div class="brand">
    <div class="brand-mark"></div>
    VibeSync
  </div>
  <nav class="nav">
    <a href="index.html" class="${active==='home'?'active':''}">
      <svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"/></svg>
      Home
    </a>
    <a href="explore.html" class="${active==='explore'?'active':''}">
      <svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M10.533 1.279c-5.18 0-9.407 4.14-9.407 9.279s4.226 9.279 9.407 9.279c2.234 0 4.29-.77 5.907-2.058l4.353 4.353a1 1 0 1 0 1.414-1.414l-4.344-4.344a9.157 9.157 0 0 0 2.077-5.816c0-5.14-4.226-9.28-9.407-9.28zm-7.407 9.279c0-4.006 3.302-7.28 7.407-7.28s7.407 3.274 7.407 7.28-3.302 7.279-7.407 7.279-7.407-3.273-7.407-7.28z"/></svg>
      Search
    </a>
  </nav>
  <div class="lib-block">
    <div class="lib-head">
      <span style="display:flex;align-items:center;gap:12px">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2.134a1 1 0 0 1 1 0l6 3.464a1 1 0 0 1 .5.866V21a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V2.134zM16 4.732V20h4V7.041l-4-2.309zM3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zm6 0a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1z"/></svg>
        Your Library
      </span>
      <button class="icon-btn" style="background:transparent" aria-label="Create">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.999 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm0 2a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm1 4v4h4v2h-4v4h-2v-4h-4v-2h4V7h2z"/></svg>
      </button>
    </div>
    <div class="playlists">
      <a href="library.html">Liked Songs</a>
      <a href="player.html">Midnight Drive</a>
      <a href="player.html">Lo-Fi Focus</a>
      <a href="player.html">Sunrise Run</a>
      <a href="player.html">Indie Bedroom</a>
      <a href="player.html">Synthwave Nights</a>
      <a href="player.html">Acoustic Mornings</a>
      <a href="player.html">Hyperpop Heat</a>
    </div>
  </div>
</aside>`;

const MINIPLAYER = `
<div class="miniplayer">
  <div class="mp-track">
    <div class="mp-cover" data-np-cover></div>
    <div class="mp-meta">
      <strong data-np-title>Search a song</strong>
      <span data-np-artist>Type in the search bar to start streaming</span>
    </div>
    <button class="icon-btn mp-like" aria-label="Like">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-.605-.463L1.348 8.309A4.582 4.582 0 0 1 1.689 2zm3.158.252A3.082 3.082 0 0 0 2.49 7.337l.005.005L7.8 13.664a.264.264 0 0 0 .311.069.262.262 0 0 0 .09-.069l5.312-6.33a3.043 3.043 0 0 0 .68-2.573 3.118 3.118 0 0 0-2.551-2.463 3.079 3.079 0 0 0-2.612.816l-.007.007a1.501 1.501 0 0 1-2.045 0l-.009-.008a3.082 3.082 0 0 0-2.121-.861z"/></svg>
    </button>
  </div>
  <div class="mp-center">
    <div class="mp-controls">
      <button class="icon-btn" aria-label="Shuffle">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"/><path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34l-.787-.937z"/></svg>
      </button>
      <button class="icon-btn" aria-label="Previous">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.606L4 9.149V14.3a.7.7 0 0 1-1.4 0V1.7a.7.7 0 0 1 .7-.7z"/></svg>
      </button>
      <button class="icon-btn" data-play-toggle data-play-icon aria-label="Play">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>
      </button>
      <button class="icon-btn" aria-label="Next">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 1.4 0V1.7a.7.7 0 0 0-.7-.7z"/></svg>
      </button>
      <button class="icon-btn" aria-label="Repeat">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"/></svg>
      </button>
    </div>
    <div class="mp-bar-wrap">
      <span data-current-time class="mp-time">0:00</span>
      <div class="mp-bar" data-seek><div data-progress-fill></div></div>
      <span data-duration class="mp-time">0:00</span>
    </div>
  </div>
  <div class="mp-right">
    <button class="icon-btn" aria-label="Now playing view">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.196 8 6 5v6z"/><path d="M15.002 1.75A1.75 1.75 0 0 0 13.252 0h-10.5a1.75 1.75 0 0 0-1.75 1.75v12.5c0 .966.784 1.75 1.75 1.75h10.5a1.75 1.75 0 0 0 1.75-1.75V1.75zm-1.75-.25a.25.25 0 0 1 .25.25v12.5a.25.25 0 0 1-.25.25h-10.5a.25.25 0 0 1-.25-.25V1.75a.25.25 0 0 1 .25-.25h10.5z"/></svg>
    </button>
    <button class="icon-btn" aria-label="Queue">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15 15H1v-1.5h14V15zm0-4.5H1V9h14v1.5zm-14-7A2.5 2.5 0 0 1 3.5 1h9a2.5 2.5 0 0 1 0 5h-9A2.5 2.5 0 0 1 1 3.5zm2.5-1a1 1 0 0 0 0 2h9a1 1 0 1 0 0-2h-9z"/></svg>
    </button>
    <button class="icon-btn" aria-label="Devices">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25V2.75zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25h-6.5z"/><path d="M4 7H1.75a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25H4V14.5H1.75A1.75 1.75 0 0 1 0 12.75v-5.5C0 6.284.784 5.5 1.75 5.5H4V7z"/></svg>
    </button>
    <button class="icon-btn" aria-label="Volume" id="mpMute">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 0 1 0 4.88z"/><path d="M11.5 13.614a5.752 5.752 0 0 0 0-11.228v1.55a4.252 4.252 0 0 1 0 8.127v1.55z"/></svg>
    </button>
    <div class="mp-volume" data-volume><div></div></div>
  </div>
</div>`;

const NOW_OVERLAY = `
<div class="now-overlay" id="nowOverlay">
  <button class="now-close" id="nowClose" aria-label="Close">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
  </button>
  <div class="now-stage">
    <div class="now-art" data-np-cover></div>
    <div class="now-info">
      <div>
        <div class="eyebrow">Now Playing</div>
        <h1 data-np-title style="margin-top:10px">No track</h1>
        <div class="artist" data-np-artist style="margin-top:8px">Search or pick a card to start</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="bar" data-seek><div class="bar-fill" data-progress-fill></div></div>
        <div class="times"><span data-current-time>0:00</span><span data-duration>0:00</span></div>
      </div>
      <div class="now-controls">
        <button class="ctrl" aria-label="Shuffle"><svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"/><path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34l-.787-.937z"/></svg></button>
        <button class="ctrl" aria-label="Previous"><svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.606L4 9.149V14.3a.7.7 0 0 1-1.4 0V1.7a.7.7 0 0 1 .7-.7z"/></svg></button>
        <button class="ctrl play-big" data-play-toggle data-play-icon aria-label="Play">
          <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>
        </button>
        <button class="ctrl" aria-label="Next"><svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 1.4 0V1.7a.7.7 0 0 0-.7-.7z"/></svg></button>
        <button class="ctrl" aria-label="Repeat"><svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"/></svg></button>
      </div>
      <div class="lyric-strip">
        <strong>Streaming</strong>
        Full 320kbps audio via local JioSaavn proxy. Use sidebar or close to return.
      </div>
    </div>
  </div>
</div>`;

function mountChrome(active) {
  document.getElementById('chrome-sidebar').innerHTML = SIDEBAR(active);
  document.getElementById('chrome-mini').innerHTML = MINIPLAYER + NOW_OVERLAY;

  document.addEventListener('click', (e) => {
    if (e.target.closest('.mp-track')) {
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
