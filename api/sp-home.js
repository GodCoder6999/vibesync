// /api/sp-home — Spotify Home-like aggregator using anon token.
// browse/new-releases + browse/featured-playlists + browse/categories.
import { sp, spAlbumToTile, spPlaylistToTile, corsJSON } from './_spotify.js';

export default async function handler(req, res) {
  const country = req.query.country || 'US';
  const limit = String(parseInt(req.query.limit || '12', 10));
  try {
    const [newRel, featured, cats] = await Promise.all([
      sp('/browse/new-releases', { country, limit }).catch(() => null),
      sp('/browse/featured-playlists', { country, limit }).catch(() => null),
      sp('/browse/categories', { country, limit: '20' }).catch(() => null),
    ]);
    corsJSON(res, {
      new_releases: (newRel?.albums?.items || []).map(spAlbumToTile),
      featured: (featured?.playlists?.items || []).filter(Boolean).map(spPlaylistToTile),
      categories: (cats?.categories?.items || []).map(c => ({
        id: c.id, title: c.name, img: c.icons?.[0]?.url || '', type: 'sp-category', query: c.name
      })),
      featured_msg: featured?.message || '',
    });
  } catch (e) { corsJSON(res, { error: e.message }, 500); }
}
