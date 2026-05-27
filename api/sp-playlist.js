// /api/sp-playlist?id=  — full Spotify playlist with tracks.
import { sp, spTrackToTile, corsJSON } from './_spotify.js';

export default async function handler(req, res) {
  const id = (req.query.id || '').trim();
  if (!id) return corsJSON(res, { error: 'missing id' }, 400);
  try {
    const p = await sp(`/playlists/${id}`, { fields: 'id,name,description,images,owner(display_name),tracks.items(track(id,name,artists,album(images,name),duration_ms))' });
    corsJSON(res, {
      id: p.id,
      title: p.name,
      subtitle: p.description || ('By ' + (p.owner?.display_name || '')),
      img: p.images?.[0]?.url || '',
      tracks: (p.tracks?.items || []).map(i => spTrackToTile(i.track)).filter(Boolean),
    });
  } catch (e) { corsJSON(res, { error: e.message }, 500); }
}
