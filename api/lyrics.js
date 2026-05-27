// /api/lyrics?title=&artist=  → LrcLib lyrics proxy (free, no auth).
// Returns: { plain, synced, instrumental }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  const title = (req.query.title || '').trim();
  const artist = (req.query.artist || '').trim();
  if (!title || !artist) {
    return res.status(400).json({ error: 'need title+artist' });
  }
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'VibeSync/1.0 (lrc fetch)' } });
    if (r.status === 404) {
      // Fallback: search endpoint
      const s = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(artist + ' ' + title)}`);
      const hits = await s.json();
      if (hits[0]) {
        return res.status(200).json({
          plain: hits[0].plainLyrics || '',
          synced: hits[0].syncedLyrics || '',
          instrumental: hits[0].instrumental || false,
          source: 'LrcLib (search fallback)',
        });
      }
      return res.status(200).json({ plain: '', synced: '', instrumental: false, source: 'none' });
    }
    if (!r.ok) throw new Error('LrcLib ' + r.status);
    const d = await r.json();
    res.status(200).json({
      plain: d.plainLyrics || '',
      synced: d.syncedLyrics || '',
      instrumental: d.instrumental || false,
      source: 'LrcLib',
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message, plain: '', synced: '' });
  }
}
