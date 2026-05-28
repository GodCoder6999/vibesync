// VibeSync catalog client — wraps /api/* endpoints.
// Soundbound-style: JioSaavn = queryable + downloadable. LrcLib = lyrics.

const API_BASE = (window.VS_CONFIG && window.VS_CONFIG.API_BASE) || '';
const _cache = {};
async function _fetch(path) {
  const url = API_BASE + path;
  if (_cache[url]) return _cache[url];
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  _cache[url] = data;
  return data;
}

window.cat = {
  // JioSaavn
  search:   (q, limit = 10) => _fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  home:     (lang = 'hindi,english') => _fetch(`/api/home?lang=${encodeURIComponent(lang)}`),
  playlist: (id) => _fetch(`/api/playlist?id=${encodeURIComponent(id)}`),
  album:    (id) => _fetch(`/api/album?id=${encodeURIComponent(id)}`),
  artist:   (opts) => {
    const qs = opts.id ? `id=${encodeURIComponent(opts.id)}` : `name=${encodeURIComponent(opts.name)}`;
    return _fetch(`/api/artist?${qs}`);
  },
  lyrics:   (title, artist) =>
    _fetch(`/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`),

  // Spotify catalog via SpotAPI (real Spotify IDs + metadata, scraped)
  sxHome:     () => _fetch('/api/sx-home'),
  sxSearch:   (q, limit = 8) => _fetch(`/api/sx-search?q=${encodeURIComponent(q)}&limit=${limit}`),
  sxPodcast:  (id) => _fetch(`/api/sx-podcast?id=${encodeURIComponent(id)}`),
  sxEpisode:  (id) => _fetch(`/api/sx-episode?id=${encodeURIComponent(id)}`),
  sxPlaylist: (id) => _fetch(`/api/sx-playlist?id=${encodeURIComponent(id)}`),
  sxAlbum:    (id) => _fetch(`/api/sx-album?id=${encodeURIComponent(id)}`),
  sxArtist:   (opts) => {
    const qs = typeof opts === 'string' ? `id=${encodeURIComponent(opts)}` :
      (opts.id ? `id=${encodeURIComponent(opts.id)}` : `name=${encodeURIComponent(opts.name)}`);
    return _fetch(`/api/sx-artist?${qs}`);
  },
};

// Match a Spotify track (no stream URL) to a JioSaavn audio source.
// Returns enriched track with `url` field, or null if no match.
window.matchAudio = async function(track) {
  if (!track) return null;
  if (track.url) return track;
  const q = track.query || `${track.title || ''} ${track.artist || ''}`.trim();
  if (!q) return null;
  try {
    const r = await window.cat.search(q, 5);
    const best = (r.results || []).find(x => x.url) || (r.results || [])[0];
    if (!best || !best.url) return null;
    return { ...track, url: best.url, jio_id: best.id };
  } catch { return null; }
};

// Like setQueue but auto-matches audio for each track before playing.
window.vsPlaySpotifyQueue = async function(tracks, startIdx = 0) {
  if (!tracks || !tracks.length) return;
  const first = await window.matchAudio(tracks[startIdx]);
  if (!first) { console.warn('No audio match for', tracks[startIdx]); return; }
  // Replace startIdx with enriched, leave rest for lazy-match on advance
  const queue = tracks.slice();
  queue[startIdx] = first;
  if (window.vsSetQueue) window.vsSetQueue(queue, startIdx);
};
