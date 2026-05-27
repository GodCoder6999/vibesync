"""
Vercel Python entrypoint. Single Flask app exposes /api/search and /api/health.

- /api/search?q=<query>&limit=<n> → JioSaavn search proxy.
  Decrypts encrypted_media_url (DES/ECB, static key 38346591), upgrades to 320kbps mp4.
- /api/health → uptime ping.
"""

import base64
import json
import urllib.parse
import urllib.request

from flask import Flask, jsonify, request
from Crypto.Cipher import DES

app = Flask(__name__)

DES_KEY = b"38346591"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120 Safari/537.36"
)


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
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read().decode("utf-8"))

    out = []
    for s in data.get("results", []):
        info = s.get("more_info", {}) or {}
        enc = info.get("encrypted_media_url") or ""
        stream = ""
        if enc:
            try:
                stream = upgrade_quality(
                    decrypt_url(enc),
                    "320" if info.get("320kbps") == "true" else "160",
                )
            except Exception:
                pass
        artists = info.get("artistMap", {}).get("primary_artists", []) or []
        artist_name = ", ".join(a.get("name", "") for a in artists[:3]) or \
            s.get("subtitle", "").split("-")[0].strip()
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


@app.after_request
def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    resp.headers["Cache-Control"] = "public, s-maxage=300"
    return resp


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "service": "vibesync"})


@app.route("/api/search", methods=["GET", "OPTIONS"])
def search():
    if request.method == "OPTIONS":
        return ("", 204)
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"error": "missing q", "results": []}), 400
    try:
        limit = int(request.args.get("limit", 10))
        return jsonify({"results": search_songs(q, limit=limit)})
    except Exception as e:
        return jsonify({"error": str(e), "results": []}), 500
