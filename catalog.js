// VibeSync catalog client — wraps /api/* endpoints.
// Soundbound-style: JioSaavn = queryable + downloadable. LrcLib = lyrics.

const _cache = {};
async function _fetch(url) {
  if (_cache[url]) return _cache[url];
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  _cache[url] = data;
  return data;
}

window.cat = {
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
};
