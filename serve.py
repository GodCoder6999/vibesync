"""
VibeSync local server.

Serves the static site and proxies JioSaavn so the browser can stream
full songs (320kbps) without CORS errors. JioSaavn returns an encrypted
media URL; we DES-decrypt with the well-known static key, upgrade to
320kbps, and hand the direct .mp4/.m4a URL to the browser.

Run:  python serve.py
URL:  http://localhost:8765
"""

import base64
import http.server
import json
import socketserver
import threading
import urllib.parse
import urllib.request
from Crypto.Cipher import DES

PORT = 8765
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
    # Replace _96 / _160 with _320 if present
    for q in ("_12", "_48", "_96", "_160"):
        url = url.replace(q + ".mp4", "_" + quality + ".mp4")
    return url


def jio_get(path: str, params: dict) -> dict:
    qs = urllib.parse.urlencode(params)
    url = f"https://www.jiosaavn.com/api.php?{path}&{qs}"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode("utf-8"))


def search_songs(query: str, limit: int = 12) -> list:
    data = jio_get(
        "__call=search.getResults",
        {
            "p": "1",
            "q": query,
            "_format": "json",
            "_marker": "0",
            "api_version": "4",
            "ctx": "web6dot0",
            "n": str(limit),
        },
    )
    out = []
    for s in data.get("results", []):
        info = s.get("more_info", {}) or {}
        enc = info.get("encrypted_media_url") or ""
        stream = ""
        if enc:
            try:
                stream = upgrade_quality(decrypt_url(enc), "320" if info.get("320kbps") == "true" else "160")
            except Exception as e:
                print("decrypt fail:", e)
        artists = info.get("artistMap", {}).get("primary_artists", []) or []
        artist_name = ", ".join(a.get("name", "") for a in artists[:3]) or s.get("subtitle", "").split("-")[0].strip()
        artist_img = ""
        if artists:
            artist_img = (artists[0].get("image", "") or "").replace("150x150", "500x500")
        out.append(
            {
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
            }
        )
    return [x for x in out if x["url"]]


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/search":
            self._handle_search(parsed.query)
            return
        if parsed.path == "/api/health":
            self._json({"ok": True})
            return
        super().do_GET()

    def _handle_search(self, query_string: str):
        params = urllib.parse.parse_qs(query_string)
        q = (params.get("q") or [""])[0].strip()
        if not q:
            self._json({"error": "missing q"}, status=400)
            return
        try:
            results = search_songs(q, limit=int((params.get("limit") or ["10"])[0]))
            self._json({"results": results})
        except Exception as e:
            print("[search error]", e)
            self._json({"error": str(e), "results": []}, status=500)

    def _json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # Silence default noisy log; keep just request line
        print("%s - %s" % (self.address_string(), fmt % args))


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    import os, sys
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with ThreadedServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"VibeSync running on http://localhost:{PORT}")
        print(f"  static:  /            (index.html, etc.)")
        print(f"  search:  /api/search?q=blinding+lights")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopping")
            sys.exit(0)
