// Shared helpers for VibeSync API functions.
// Imported by /api/search, /api/home, /api/artist, /api/playlist, /api/album.

import CryptoJS from 'crypto-js';

export const KEY = CryptoJS.enc.Utf8.parse('38346591');
export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

export function decryptUrl(enc) {
  if (!enc) return '';
  try {
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(enc) },
      KEY,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.warn('decrypt fail', e.message);
    return '';
  }
}

export function upgradeQuality(url, quality = '320') {
  if (!url) return url;
  if (url.startsWith('http://')) url = 'https://' + url.slice(7);
  for (const q of ['_12', '_48', '_96', '_160']) {
    url = url.split(q + '.mp4').join('_' + quality + '.mp4');
  }
  return url;
}

export function bigImg(url) {
  return (url || '').replace('150x150', '500x500');
}

export function cleanText(s) {
  return (s || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
}

// JioSaavn raw API call
export async function jio(call, params = {}) {
  const qs = new URLSearchParams({
    __call: call,
    _format: 'json',
    _marker: '0',
    api_version: '4',
    ctx: 'web6dot0',
    ...params,
  });
  const url = `https://www.jiosaavn.com/api.php?${qs}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('JioSaavn ' + r.status);
  return r.json();
}

// Normalize a JioSaavn song object → unified track shape
export function formatTrack(s) {
  const info = s.more_info || {};
  const enc = info.encrypted_media_url || '';
  const stream = enc ? upgradeQuality(decryptUrl(enc), info['320kbps'] === 'true' ? '320' : '160') : '';
  const artists = info.artistMap?.primary_artists || [];
  const artistName = artists.slice(0, 3).map(a => a.name).join(', ')
    || (s.subtitle || '').split('-')[0].trim();
  const artistImg = artists[0] ? bigImg(artists[0].image || '') : '';
  return {
    id: s.id,
    title: cleanText(s.title),
    artist: cleanText(artistName),
    artist_id: artists[0]?.id || '',
    artist_img: artistImg,
    album: cleanText(info.album || ''),
    album_id: info.album_id || '',
    img: bigImg(s.image),
    url: stream,
    duration: parseInt(info.duration || 0, 10),
    has_lyrics: info.has_lyrics === 'true',
    source: 'JioSaavn',
  };
}

// Shared CORS + JSON sender
export function sendJSON(res, obj, status = 200) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=300');
  res.status(status).json(obj);
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.status(204).end();
    return true;
  }
  return false;
}
