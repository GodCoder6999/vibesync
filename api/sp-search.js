// /api/sp-search?q=&type=track,artist,album,playlist&limit=
import { sp, spTrackToTile, spAlbumToTile, spPlaylistToTile, spArtistToTile, corsJSON } from './_spotify.js';

export default async function handler(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return corsJSON(res, { error: 'missing q' }, 400);
  const type = req.query.type || 'track,artist,album,playlist';
  const limit = parseInt(req.query.limit || '8', 10);
  try {
    const data = await sp('/search', { q, type, limit: String(limit) });
    corsJSON(res, {
      tracks: (data.tracks?.items || []).map(spTrackToTile).filter(Boolean),
      artists: (data.artists?.items || []).map(spArtistToTile),
      albums: (data.albums?.items || []).filter(Boolean).map(spAlbumToTile),
      playlists: (data.playlists?.items || []).filter(Boolean).map(spPlaylistToTile),
    });
  } catch (e) { corsJSON(res, { error: e.message }, 500); }
}
