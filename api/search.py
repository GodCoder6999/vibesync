"""
Vercel serverless function: /api/search?q=<query>&limit=<n>

JioSaavn search proxy. DES-decrypts encrypted media URL with static key,
upgrades to 320kbps mp4, returns CORS-friendly JSON with stream URL +
poster + artist photo. Same logic as local serve.py.
"""

import base64
import json
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler

from Crypto.Cipher import DES

DES_KEY = b"38346591"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"


def decrypt_url(enc: str) -> str:
    cipher = DES.new(DES_KEY, DES.MODE_ECB)
    raw = base64.b64decode(enc)
    out = cipher.decrypt(raw)
    pad = out[-1]
    out = out[:-pad]
    return out.decode("utf-8", errors="ignore")


def upgrade_quality(url: str, quality: str = "320") -> str:
    if not url:
        return url
    if url.startswith("http://"):
        url = "https://" + url[7:]
    for q in ("_12", "_48", "_96", "_160"):
        url = url.replace(q + ".mp4", "_" + quality + ".mp4")
    return url


def search_songs(query: str, limit: int = 12) -> list:
    qs = urllib.parse.urlencode({
        "p": "1",
        "q": query,
        "_format": "json",
        "_marker": "0",
        "api_version": "4",
        "ctx": "web6dot0",
        "n": str(limit),
    })
    url = f"https://www.jiosaavn.com/api.php?__call=search.getResults&{qs}"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read().decode("utf-8"))

    out = []
    for s in data.get("results", []):
        info = s.get("more_info", {}) or {}
        enc = info.get("encrypted_media_url") or ""
        stream = ""
        if enc:
            try:
                stream = upgrade_quality(decrypt_url(enc), "320" if info.get("320kbps") == "true" else "160")
            except Exception:
                pass
        artists = info.get("artistMap", {}).get("primary_artists", []) or []
        artist_name = ", ".join(a.get("name", "") for a in artists[:3]) or s.get("subtitle", "").split("-")[0].strip()
        artist_img = ""
        if artists:
            artist_img = (artists[0].get("image", "") or "").replace("150x150", "500x500")
        out.append({
            "id": s.get("id"),
            "title": (s.get("title") or "").replace("&quot;", '"').replace("&amp;", "&"),
            "artist": artist_name.replace("&quot;", '"').replace("&amp;", "&"),
            "artist_img": artist_img,
            "album": info.get("album", ""),
            "img": (s.get("image") or "").replace("150x150", "500x500"),
            "url": stream,
            "duration": int(info.get("duration") or 0),
            "preview": False,
            "source": "JioSaavn",
        })
    return [x for x in out if x["url"]]


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        q = (params.get("q") or [""])[0].strip()
        if not q:
            self._json({"error": "missing q", "results": []}, 400)
            return
        try:
            limit = int((params.get("limit") or ["10"])[0])
            results = search_songs(q, limit=limit)
            self._json({"results": results})
        except Exception as e:
            self._json({"error": str(e), "results": []}, 500)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Cache-Control", "public, s-maxage=300")

    def _json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)
