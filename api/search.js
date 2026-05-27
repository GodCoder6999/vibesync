// /api/search?q=<query>&limit=<n> — JioSaavn search proxy.
import { jio, formatTrack, sendJSON, handleOptions } from './_lib.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const q = (req.query.q || '').trim();
  if (!q) return sendJSON(res, { error: 'missing q', results: [] }, 400);
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const data = await jio('search.getResults', { p: '1', q, n: String(limit) });
    const results = (data.results || []).map(formatTrack).filter(t => t.url);
    sendJSON(res, { results });
  } catch (e) {
    console.error(e);
    sendJSON(res, { error: e.message, results: [] }, 500);
  }
}
