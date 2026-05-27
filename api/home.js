// /api/home — JioSaavn homepage: new albums, charts, featured playlists, genres.
import { jio, bigImg, cleanText, sendJSON, handleOptions } from './_lib.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    const lang = req.query.lang || 'hindi,english';
    const data = await jio('content.getHomepageData', { language: lang, n: '1' });

    const new_albums = (data.new_albums || []).slice(0, 12).map(a => ({
      id: a.id,
      title: cleanText(a.title),
      subtitle: cleanText(a.subtitle || a.more_info?.music || ''),
      img: bigImg(a.image),
      type: 'album',
      query: `${cleanText(a.title)} ${cleanText(a.subtitle || '')}`.trim()
    }));

    const playlists = (data.featured_playlists || data.top_playlists || []).slice(0, 12).map(p => ({
      id: p.id,
      title: cleanText(p.title),
      subtitle: cleanText(p.subtitle || p.more_info?.firstname || ''),
      img: bigImg(p.image),
      type: 'playlist',
      query: cleanText(p.title)
    }));

    const charts = (data.charts || []).slice(0, 12).map(c => ({
      id: c.id,
      title: cleanText(c.title),
      subtitle: cleanText(c.subtitle || ''),
      img: bigImg(c.image),
      type: 'chart',
      query: cleanText(c.title)
    }));

    const genres = (data.genres || []).slice(0, 8).map(g => ({
      title: cleanText(g.title || g.name || ''),
      img: bigImg(g.image || ''),
      query: cleanText(g.title || g.name || '')
    }));

    sendJSON(res, { new_albums, playlists, charts, genres });
  } catch (e) {
    console.error(e);
    sendJSON(res, { error: e.message, new_albums: [], playlists: [], charts: [], genres: [] }, 500);
  }
}
