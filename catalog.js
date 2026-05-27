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

  // Spotify-anon (only works if Render IP allowed by Spotify)
  spToken:    () => _fetch('/api/sp-token'),
  spSearch:   (q, limit = 8) => _fetch(`/api/sp-search?q=${encodeURIComponent(q)}&limit=${limit}`),
  spHome:     (country = 'US') => _fetch(`/api/sp-home?country=${country}`),
  spPlaylist: (id) => _fetch(`/api/sp-playlist?id=${encodeURIComponent(id)}`),
  spAlbum:    (id) => _fetch(`/api/sp-album?id=${encodeURIComponent(id)}`),
  spArtist:   (opts) => {
    const qs = opts.id ? `id=${encodeURIComponent(opts.id)}` : `name=${encodeURIComponent(opts.name)}`;
    return _fetch(`/api/sp-artist?${qs}`);
  },
};
