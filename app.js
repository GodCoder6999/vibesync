// VibeSync — UI handlers (every button does something).
// Audio + search live in api.js. Catalog calls in catalog.js. Sidebar in partials.js.

const HEART_OUTLINE = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-.605-.463L1.348 8.309A4.582 4.582 0 0 1 1.689 2zm3.158.252A3.082 3.082 0 0 0 2.49 7.337l.005.005L7.8 13.664a.264.264 0 0 0 .311.069.262.262 0 0 0 .09-.069l5.312-6.33a3.043 3.043 0 0 0 .68-2.573 3.118 3.118 0 0 0-2.551-2.463 3.079 3.079 0 0 0-2.612.816l-.007.007a1.501 1.501 0 0 1-2.045 0l-.009-.008a3.082 3.082 0 0 0-2.121-.861z"/></svg>';
const HEART_FILL = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.578z"/></svg>';

// ---------- Audio control state ----------
const state = {
  shuffle: false,
  repeat: 'off', // off | one | all
  liked: new Set(JSON.parse(localStorage.getItem('vs_liked') || '[]')),
  queue: [],
  queueIdx: -1,
};

function persistLiked() {
  localStorage.setItem('vs_liked', JSON.stringify([...state.liked]));
}
function saveLikedTrack(track) {
  const cur = JSON.parse(localStorage.getItem('vs_liked_tracks') || '[]');
  if (cur.find(t => t.id === track.id)) return;
  cur.unshift(track);
  localStorage.setItem('vs_liked_tracks', JSON.stringify(cur.slice(0, 200)));
}
function removeLikedTrack(id) {
  const cur = JSON.parse(localStorage.getItem('vs_liked_tracks') || '[]').filter(t => t.id !== id);
  localStorage.setItem('vs_liked_tracks', JSON.stringify(cur));
}

function toast(msg, ms = 2500) {
  let t = document.getElementById('vs-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'vs-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toast._h);
  toast._h = setTimeout(() => { t.style.opacity = '0'; }, ms);
}

// ---------- Click delegate ----------
document.addEventListener('click', (e) => {
  // Like (mini-player)
  const like = e.target.closest('.mp-like');
  if (like) {
    const cur = window.vsCurrentTrack;
    if (!cur) { toast('Pick a song first'); return; }
    if (state.liked.has(cur.id)) {
      state.liked.delete(cur.id);
      removeLikedTrack(cur.id);
      like.classList.remove('liked');
      like.innerHTML = HEART_OUTLINE;
      toast('Removed from Liked Songs');
    } else {
      state.liked.add(cur.id);
      saveLikedTrack(cur);
      like.classList.add('liked');
      like.innerHTML = HEART_FILL;
      toast('Added to Liked Songs');
    }
    persistLiked();
    return;
  }

  // Mute toggle (volume speaker icon)
  if (e.target.closest('#mpMute')) {
    const vol = document.querySelector('[data-volume] > div');
    if (window.vsAudio) {
      if (window.vsAudio.volume > 0) {
        window.vsAudio._lastVol = window.vsAudio.volume;
        window.vsAudio.volume = 0;
        if (vol) vol.style.width = '0%';
      } else {
        window.vsAudio.volume = window.vsAudio._lastVol || 0.8;
        if (vol) vol.style.width = (window.vsAudio.volume * 100) + '%';
      }
    }
    return;
  }

  // Shuffle
  const shuffleBtn = e.target.closest('.mp-controls [aria-label="Shuffle"]');
  if (shuffleBtn) {
    state.shuffle = !state.shuffle;
    shuffleBtn.style.color = state.shuffle ? 'var(--accent)' : '';
    toast('Shuffle ' + (state.shuffle ? 'on' : 'off'));
    return;
  }

  // Repeat
  const repeatBtn = e.target.closest('.mp-controls [aria-label="Repeat"]');
  if (repeatBtn) {
    state.repeat = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    repeatBtn.style.color = state.repeat !== 'off' ? 'var(--accent)' : '';
    toast('Repeat: ' + state.repeat);
    if (window.vsAudio) window.vsAudio.loop = state.repeat === 'one';
    return;
  }

  // Previous
  const prevBtn = e.target.closest('.mp-controls [aria-label="Previous"]');
  if (prevBtn) {
    if (window.vsAudio && window.vsAudio.currentTime > 3) {
      window.vsAudio.currentTime = 0;
      return;
    }
    playPrev(); return;
  }

  // Next
  const nextBtn = e.target.closest('.mp-controls [aria-label="Next"]');
  if (nextBtn) { playNext(); return; }

  // Topbar Install / Bell / Avatar
  if (e.target.closest('#installBtn')) { toast('Install option coming soon'); return; }
  if (e.target.closest('[aria-label="Notifications"]') && !e.target.closest('.miniplayer')) {
    toast('No new notifications'); return;
  }
  if (e.target.closest('.avatar-btn')) {
    if (confirm('Log out + reset preferences?')) {
      ['vs_user', 'vs_prefs', 'vs_prefs_full'].forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      location.href = 'welcome.html';
    }
    return;
  }

  // Topbar back/forward arrows
  if (e.target.closest('.tb-arrows .arrow')) {
    const idx = [...e.target.closest('.tb-arrows').children].indexOf(e.target.closest('.arrow'));
    if (idx === 0) history.back();
    else history.forward();
    return;
  }

  // Sidebar nav
  // (handled by anchor href)

  // Sidebar create (plus)
  const sbPlus = e.target.closest('.sb-lib-head .icon-btn');
  if (sbPlus) { toast('Create playlist coming soon'); return; }

  // Sidebar chips (filter library by type)
  const sbChip = e.target.closest('.sb-chip');
  if (sbChip) {
    sbChip.parentElement.querySelectorAll('.sb-chip').forEach(c => c.classList.remove('active'));
    sbChip.classList.add('active');
    return;
  }

  // Home filter chips (All / Music / Podcasts)
  const filterChip = e.target.closest('.filter-row .filter-chip');
  if (filterChip) {
    filterChip.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    filterChip.classList.add('active');
    return;
  }

  // Library tabs (legacy class)
  const tab = e.target.closest('.lib-tab');
  if (tab) {
    tab.parentElement.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    return;
  }

  // Sidebar item click — route by kind
  const sbItem = e.target.closest('.sb-item');
  if (sbItem) {
    const title = sbItem.querySelector('strong')?.textContent || '';
    if (title === 'Liked Songs') { location.href = 'library.html'; return; }
    if (sbItem.classList.contains('artist')) {
      location.href = 'artist.html?name=' + encodeURIComponent(title) + '&src=sx';
    } else {
      location.href = 'explore.html?q=' + encodeURIComponent(title);
    }
    return;
  }

  // Section "Show all" link
  const showAll = e.target.closest('.section-head a');
  if (showAll) {
    e.preventDefault();
    const h2 = showAll.parentElement.querySelector('h2')?.textContent || '';
    if (h2) location.href = 'explore.html?q=' + encodeURIComponent(h2.replace(/ Mix$/, ''));
    return;
  }

  // PlayingBar extra buttons
  if (e.target.closest('.mp-right [aria-label="Now Playing View"]')) {
    document.getElementById('nowOverlay')?.classList.add('open');
    return;
  }
  if (e.target.closest('.mp-right [aria-label="Queue"]')) {
    toast(`${state.queue.length} tracks in queue`);
    return;
  }
  if (e.target.closest('.mp-right [aria-label="Connect to a device"]')) {
    toast('Playing on Web Player (this browser)'); return;
  }
  if (e.target.closest('.mp-right [aria-label="Full screen"]')) {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
    return;
  }
});

// ---------- Volume slider drag ----------
document.addEventListener('mousedown', (e) => {
  const vol = e.target.closest('[data-volume]');
  if (!vol) return;
  const update = (clientX) => {
    const rect = vol.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (window.vsAudio) window.vsAudio.volume = p;
    vol.querySelector('div').style.width = (p * 100) + '%';
  };
  update(e.clientX);
  const move = (ev) => update(ev.clientX);
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
});

// ---------- Seek bar drag (mp-bar + now-overlay bar) ----------
document.addEventListener('mousedown', (e) => {
  const bar = e.target.closest('[data-seek]');
  if (!bar) return;
  const update = (clientX) => {
    if (!window.vsAudio || !window.vsAudio.duration) return;
    const rect = bar.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    window.vsAudio.currentTime = window.vsAudio.duration * p;
  };
  update(e.clientX);
  const move = (ev) => update(ev.clientX);
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
});

// ---------- Queue helpers ----------
// Tracks may come from Spotify catalog (no url) — audio is lazy-matched via
// JioSaavn search on play. The track keeps its Spotify cover/metadata.
window.vsSetQueue = function(tracks, startIdx = 0) {
  state.queue = (tracks || []).filter(Boolean);
  state.queueIdx = startIdx;
  if (state.queue[startIdx]) playQueueIdx(startIdx);
};

async function playQueueIdx(i) {
  let t = state.queue[i];
  if (!t || !window.vsAudio) return;
  state.queueIdx = i;
  if (!t.url && window.matchAudio) {
    if (window.updateNowPlaying) window.updateNowPlaying(t, { loading: true });
    const matched = await window.matchAudio(t);
    if (matched && matched.url) {
      t = { ...t, url: matched.url };
      state.queue[i] = t;
    } else {
      if (window.vsToast) window.vsToast('No audio match for ' + (t.title || ''));
      return;
    }
  }
  window.vsAudio.src = t.url;
  window.vsAudio.play();
  if (window.updateNowPlaying) window.updateNowPlaying(t);
  if (window.loadLyricsFor) window.loadLyricsFor(t);
  window.vsCurrentTrack = t;
}

function playNext() {
  if (!state.queue.length) { toast('No queue'); return; }
  let next;
  if (state.shuffle) next = Math.floor(Math.random() * state.queue.length);
  else next = state.queueIdx + 1;
  if (next >= state.queue.length) {
    if (state.repeat === 'all') next = 0;
    else { toast('End of queue'); return; }
  }
  playQueueIdx(next);
}

function playPrev() {
  if (!state.queue.length) { toast('No queue'); return; }
  let prev = state.queueIdx - 1;
  if (prev < 0) {
    if (state.repeat === 'all') prev = state.queue.length - 1;
    else prev = 0;
  }
  playQueueIdx(prev);
}

// Auto-advance on track end
window.addEventListener('load', () => {
  if (window.vsAudio) {
    window.vsAudio.addEventListener('ended', () => {
      if (state.repeat === 'one') { window.vsAudio.currentTime = 0; window.vsAudio.play(); return; }
      playNext();
    });
  }
});

// ---------- Track current track for like state ----------
const _origUpdateNP = () => {};
document.addEventListener('vs:trackchange', (e) => {
  window.vsCurrentTrack = e.detail;
  const likeBtn = document.querySelector('.mp-like');
  if (likeBtn) {
    const liked = state.liked.has(e.detail.id);
    likeBtn.classList.toggle('liked', liked);
    likeBtn.innerHTML = liked ? HEART_FILL : HEART_OUTLINE;
  }
});

// Expose for diagnostics
window.vsState = state;
window.vsToast = toast;
