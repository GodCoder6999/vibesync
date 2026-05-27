// /api/sp-artist?id= or ?name= — artist profile: top tracks, albums, related artists.
import { sp, spTrackToTile, spAlbumToTile, spArtistToTile, corsJSON } from './_spotify.js';

export default async function handler(req, res) {
  let id = (req.query.id || '').trim();
  const name = (req.query.name || '').trim();
  try {
    if (!id && name) {
      const s = await sp('/search', { q: name, type: 'artist', limit: '1' });
      id = s?.artists?.items?.[0]?.id;
      if (!id) return corsJSON(res, { error: 'artist not found' }, 404);
    }
    if (!id) return corsJSON(res, { error: 'need id or name' }, 400);
    const [a, top, albums] = await Promise.all([
      sp(`/artists/${id}`),
      sp(`/artists/${id}/top-tracks`, { market: 'US' }).catch(() => ({ tracks: [] })),
      sp(`/artists/${id}/albums`, { include_groups: 'album,single', limit: '20', market: 'US' }).catch(() => ({ items: [] })),
    ]);
    corsJSON(res, {
      id: a.id,
      name: a.name,
      img: a.images?.[0]?.url || '',
      follower_count: a.followers?.total || 0,
      genres: a.genres || [],
      top_tracks: (top.tracks || []).map(spTrackToTile),
      albums: (albums.items || []).map(spAlbumToTile),
    });
  } catch (e) { corsJSON(res, { error: e.message }, 500); }
}
