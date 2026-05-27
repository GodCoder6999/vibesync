// VibeSync — Spotify Web API client with PKCE auth.
// Audio playback NOT through Spotify. We use track metadata → JioSaavn proxy → stream.

const SPOTIFY_AUTH = 'https://accounts.spotify.com';
const SPOTIFY_API  = 'https://api.spotify.com/v1';

// ---------- PKCE helpers ----------
function randomString(len = 64) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => ('0' + b.toString(16)).slice(-2)).join('');
}
async function sha256(plain) {
  const enc = new TextEncoder().encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return new Uint8Array(hash);
}
function base64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------- Auth flow ----------
async function spotifyLogin() {
  const cfg = window.VS_CONFIG;
  const verifier = randomString(64);
  const challenge = base64url(await sha256(verifier));
  sessionStorage.setItem('vs_sp_verifier', verifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.SPOTIFY_CLIENT_ID,
    scope: cfg.SPOTIFY_SCOPES,
    redirect_uri: cfg.SPOTIFY_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state: randomString(16)
  });
  location.href = `${SPOTIFY_AUTH}/authorize?${params}`;
}

async function spotifyExchange(code) {
  const cfg = window.VS_CONFIG;
  const verifier = sessionStorage.getItem('vs_sp_verifier');
  if (!verifier) throw new Error('Missing PKCE verifier');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: cfg.SPOTIFY_REDIRECT_URI,
    client_id: cfg.SPOTIFY_CLIENT_ID,
    code_verifier: verifier
  });
  const r = await fetch(`${SPOTIFY_AUTH}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!r.ok) throw new Error('Token exchange ' + r.status);
  const tok = await r.json();
  saveTokens(tok);
  sessionStorage.removeItem('vs_sp_verifier');
  return tok;
}

async function spotifyRefresh() {
  const cfg = window.VS_CONFIG;
  const refresh = localStorage.getItem('vs_sp_refresh');
  if (!refresh) throw new Error('No refresh token');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh,
    client_id: cfg.SPOTIFY_CLIENT_ID
  });
  const r = await fetch(`${SPOTIFY_AUTH}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!r.ok) throw new Error('Refresh ' + r.status);
  const tok = await r.json();
  saveTokens(tok);
  return tok;
}

function saveTokens(tok) {
  localStorage.setItem('vs_sp_token', tok.access_token);
  localStorage.setItem('vs_sp_expiry', String(Date.now() + (tok.expires_in - 60) * 1000));
  if (tok.refresh_token) localStorage.setItem('vs_sp_refresh', tok.refresh_token);
}

function spotifyLogout() {
  ['vs_sp_token', 'vs_sp_expiry', 'vs_sp_refresh', 'vs_sp_user'].forEach(k => localStorage.removeItem(k));
}

function isSpotifyConnected() {
  return !!localStorage.getItem('vs_sp_token');
}

async function getValidToken() {
  let tok = localStorage.getItem('vs_sp_token');
  const exp = Number(localStorage.getItem('vs_sp_expiry') || 0);
  if (!tok) return null;
  if (Date.now() >= exp) {
    try { await spotifyRefresh(); tok = localStorage.getItem('vs_sp_token'); }
    catch (e) { console.warn('refresh failed', e); spotifyLogout(); return null; }
  }
  return tok;
}

// ---------- API helpers ----------
async function spApi(path, opts = {}) {
  const tok = await getValidToken();
  if (!tok) throw new Error('Not connected to Spotify');
  const r = await fetch(`${SPOTIFY_API}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), 'Authorization': 'Bearer ' + tok }
  });
  if (r.status === 401) { spotifyLogout(); throw new Error('Spotify session expired'); }
  if (!r.ok) throw new Error('Spotify ' + r.status + ' on ' + path);
  if (r.status === 204) return null;
  return r.json();
}

async function spMe()          { return spApi('/me'); }
async function spTopArtists()  { return spApi('/me/top/artists?limit=10'); }
async function spTopTracks()   { return spApi('/me/top/tracks?limit=10'); }
async function spRecent()      { return spApi('/me/player/recently-played?limit=20'); }
async function spPlaylists()   { return spApi('/me/playlists?limit=30'); }
async function spSavedTracks() { return spApi('/me/tracks?limit=30'); }
async function spFollowedArtists() { return spApi('/me/following?type=artist&limit=20'); }
async function spNewReleases() { return spApi('/browse/new-releases?limit=10'); }
async function spFeatured()    { return spApi('/browse/featured-playlists?limit=10'); }
async function spCategories()  { return spApi('/browse/categories?limit=20'); }
async function spSearch(q, types = 'track,artist,album,playlist') {
  return spApi(`/search?q=${encodeURIComponent(q)}&type=${types}&limit=10`);
}
async function spArtist(id)        { return spApi(`/artists/${id}`); }
async function spArtistTop(id)     { return spApi(`/artists/${id}/top-tracks?market=from_token`); }
async function spArtistAlbums(id)  { return spApi(`/artists/${id}/albums?limit=20`); }
async function spAlbum(id)         { return spApi(`/albums/${id}`); }
async function spPlaylist(id)      { return spApi(`/playlists/${id}`); }

// ---------- Bridge: Spotify track → JioSaavn stream ----------
async function playSpotifyTrack(track) {
  // track: { name, artists: [{name}], album: {images: [{url}]} }
  const title = track.name;
  const artist = (track.artists || []).map(a => a.name).join(' ');
  const q = `${title} ${artist}`.trim();
  if (window.searchAndPlay) {
    window.searchAndPlay(q);
  } else {
    // Fallback to /api/search direct
    const r = await fetch('/api/search?q=' + encodeURIComponent(q) + '&limit=1');
    const j = await r.json();
    const hit = j.results?.[0];
    if (hit && window.vsAudio) {
      window.vsAudio.src = hit.url;
      window.vsAudio.play();
    }
  }
}

// Expose globally
window.spotifyLogin = spotifyLogin;
window.spotifyExchange = spotifyExchange;
window.spotifyLogout = spotifyLogout;
window.isSpotifyConnected = isSpotifyConnected;
window.spApi = spApi;
window.sp = {
  me: spMe, topArtists: spTopArtists, topTracks: spTopTracks,
  recent: spRecent, playlists: spPlaylists, saved: spSavedTracks,
  followed: spFollowedArtists, newReleases: spNewReleases,
  featured: spFeatured, categories: spCategories, search: spSearch,
  artist: spArtist, artistTop: spArtistTop, artistAlbums: spArtistAlbums,
  album: spAlbum, playlist: spPlaylist
};
window.playSpotifyTrack = playSpotifyTrack;
