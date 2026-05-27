// /api/artist?id=<id> OR ?name=<name> — JioSaavn artist top songs + albums.
import { jio, formatTrack, bigImg, cleanText, sendJSON, handleOptions } from './_lib.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const id = (req.query.id || '').trim();
  const name = (req.query.name || '').trim();
  if (!id && !name) return sendJSON(res, { error: 'need id or name' }, 400);
  try {
    let artistId = id;
    if (!artistId && name) {
      const s = await jio('search.getArtists', { p: '1', q: name, n: '1' });
      artistId = s?.results?.[0]?.id || '';
      if (!artistId) return sendJSON(res, { error: 'artist not found', name, top_songs: [] }, 404);
    }
    const data = await jio('artist.getArtistPageDetails', { artistId });
    const top = (data.topSongs || []).map(formatTrack).filter(t => t.url);
    const albums = (data.topAlbums || data.albums || []).slice(0, 12).map(a => ({
      id: a.id,
      title: cleanText(a.title || a.name),
      subtitle: cleanText(a.subtitle || a.year || ''),
      img: bigImg(a.image),
      type: 'album',
    }));
    sendJSON(res, {
      id: data.artistId || artistId,
      name: cleanText(data.name || name),
      img: bigImg(data.image),
      bio: cleanText(data.bio || ''),
      follower_count: data.follower_count || 0,
      top_songs: top,
      albums,
    });
  } catch (e) {
    console.error(e);
    sendJSON(res, { error: e.message, top_songs: [] }, 500);
  }
}
