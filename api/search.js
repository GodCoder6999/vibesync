// Vercel Node serverless function: /api/search?q=<query>&limit=<n>
// JioSaavn proxy. DES-ECB decrypt encrypted_media_url, upgrade to 320kbps mp4.

import crypto from 'node:crypto';

const KEY = Buffer.from('38346591');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

function decryptUrl(enc) {
  // Node 17+ supports des-ecb. Padding: PKCS5 (default with setAutoPadding).
  const decipher = crypto.createDecipheriv('des-ecb', KEY, null);
  decipher.setAutoPadding(true);
  const buf = Buffer.concat([decipher.update(enc, 'base64'), decipher.final()]);
  return buf.toString('utf8');
}

function upgradeQuality(url, quality = '320') {
  if (!url) return url;
  if (url.startsWith('http://')) url = 'https://' + url.slice(7);
  for (const q of ['_12', '_48', '_96', '_160']) {
    url = url.split(q + '.mp4').join('_' + quality + '.mp4');
  }
  return url;
}

async function searchSongs(query, limit = 12) {
  const params = new URLSearchParams({
    __call: 'search.getResults',
    p: '1',
    q: query,
    _format: 'json',
    _marker: '0',
    api_version: '4',
    ctx: 'web6dot0',
    n: String(limit),
  });
  const url = `https://www.jiosaavn.com/api.php?${params}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('JioSaavn ' + r.status);
  const data = await r.json();

  const out = [];
  for (const s of data.results || []) {
    const info = s.more_info || {};
    const enc = info.encrypted_media_url || '';
    let stream = '';
    if (enc) {
      try {
        stream = upgradeQuality(decryptUrl(enc), info['320kbps'] === 'true' ? '320' : '160');
      } catch (e) { console.warn('decrypt fail', e); }
    }
    const artists = (info.artistMap?.primary_artists) || [];
    const artistName = artists.slice(0, 3).map(a => a.name).join(', ')
      || (s.subtitle || '').split('-')[0].trim();
    const artistImg = artists[0] ? (artists[0].image || '').replace('150x150', '500x500') : '';
    out.push({
      id: s.id,
      title: (s.title || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      artist: artistName.replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
      artist_img: artistImg,
      album: info.album || '',
      img: (s.image || '').replace('150x150', '500x500'),
      url: stream,
      duration: parseInt(info.duration || 0, 10),
      preview: false,
      source: 'JioSaavn',
    });
  }
  return out.filter(x => x.url);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=300');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const q = (req.query.q || '').trim();
  if (!q) { res.status(400).json({ error: 'missing q', results: [] }); return; }

  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const results = await searchSongs(q, limit);
    res.status(200).json({ results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message, results: [] });
  }
}
