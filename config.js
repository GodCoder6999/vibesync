// VibeSync — public config (safe in browser; Spotify PKCE flow needs no secret)
window.VS_CONFIG = {
  SPOTIFY_CLIENT_ID: '4ce831c2ae3a4dc4902582e8b59c1302',
  SPOTIFY_REDIRECT_URI: (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:8765/callback.html'
    : location.origin + '/callback.html',
  SPOTIFY_SCOPES: [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-recently-played',
    'user-follow-read'
  ].join(' ')
};
