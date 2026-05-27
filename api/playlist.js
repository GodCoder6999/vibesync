// /api/playlist?id=<id> — JioSaavn playlist details + tracks.
import { jio, formatTrack, bigImg, cleanText, sendJSON, handleOptions } from './_lib.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const id = (req.query.id || '').trim();
  if (!id) return sendJSON(res, { error: 'missing id' }, 400);
  try {
    const data = await jio('playlist.getDetails', { listid: id });
    const tracks = (data.songs || data.list || []).map(formatTrack).filter(t => t.url);
    sendJSON(res, {
      id: data.id,
      title: cleanText(data.title || data.listname || ''),
      subtitle: cleanText(data.subtitle || ''),
      img: bigImg(data.image),
      followers: data.follower_count || 0,
      tracks,
    });
  } catch (e) {
    console.error(e);
    sendJSON(res, { error: e.message, tracks: [] }, 500);
  }
}
