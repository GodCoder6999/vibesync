// /api/sp-album?id=
import { sp, spTrackToTile, corsJSON } from './_spotify.js';

export default async function handler(req, res) {
  const id = (req.query.id || '').trim();
  if (!id) return corsJSON(res, { error: 'missing id' }, 400);
  try {
    const a = await sp(`/albums/${id}`);
    const tracks = (a.tracks?.items || []).map(t => spTrackToTile({
      ...t, album: { images: a.images, name: a.name }
    }));
    corsJSON(res, {
      id: a.id,
      title: a.name,
      subtitle: (a.artists || []).map(x => x.name).join(', '),
      img: a.images?.[0]?.url || '',
      year: (a.release_date || '').slice(0, 4),
      tracks,
    });
  } catch (e) { corsJSON(res, { error: e.message }, 500); }
}
