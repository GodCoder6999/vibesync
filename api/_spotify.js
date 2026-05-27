// Shared Spotify anonymous-token client. Used by /api/sp-* endpoints.
// Token from open.spotify.com/get_access_token works for public catalog
// without OAuth or Premium. Cache for ~50 min.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

let _token = null;
let _expiry = 0;

export async function getAnonToken() {
  const now = Date.now();
  if (_token && now < _expiry - 60_000) return _token;
  const r = await fetch(
    'https://open.spotify.com/get_access_token?reason=transport&productType=embed',
    { headers: { 'User-Agent': UA, 'Accept': 'application/json' } }
  );
  if (!r.ok) throw new Error('anon token ' + r.status);
  const d = await r.json();
  _token = d.accessToken;
  _expiry = d.accessTokenExpirationTimestampMs || (now + 3300_000);
  return _token;
}

export async function sp(path, params = {}) {
  const tok = await getAnonToken();
  const qs = Object.keys(params).length ? '?' + new URLSearchParams(params) : '';
  const r = await fetch('https://api.spotify.com/v1' + path + qs, {
    headers: { 'Authorization': 'Bearer ' + tok, 'Accept': 'application/json' }
  });
  if (r.status === 401) {
    _token = null; _expiry = 0;
    throw new Error('Spotify 401 (token refresh next call)');
  }
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error('Spotify ' + r.status + ' ' + path + ' ' + body.slice(0, 100));
  }
  if (r.status === 204) return null;
  return r.json();
}

// Helpers to shape Spotify objects to our generic tile/track types
export function spTrackToTile(t) {
  if (!t) return null;
  return {
    id: t.id,
    title: t.name,
    subtitle: (t.artists || []).map(a => a.name).join(', '),
    img: t.album?.images?.[0]?.url || '',
    type: 'sp-track',
    query: `${t.name} ${(t.artists || [])[0]?.name || ''}`.trim(),
  };
}

export function spAlbumToTile(a) {
  return {
    id: a.id,
    title: a.name,
    subtitle: (a.artists || []).map(x => x.name).join(', '),
    img: a.images?.[0]?.url || '',
    type: 'sp-album',
    query: `${a.name} ${(a.artists || [])[0]?.name || ''}`.trim(),
  };
}

export function spPlaylistToTile(p) {
  return {
    id: p.id,
    title: p.name,
    subtitle: p.description || ('By ' + (p.owner?.display_name || '')),
    img: p.images?.[0]?.url || '',
    type: 'sp-playlist',
    query: p.name,
  };
}

export function spArtistToTile(a) {
  return {
    id: a.id,
    title: a.name,
    subtitle: 'Artist',
    img: a.images?.[0]?.url || '',
    type: 'sp-artist',
    query: a.name,
  };
}

export function corsJSON(res, obj, status = 200) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=180');
  res.status(status).json(obj);
}
