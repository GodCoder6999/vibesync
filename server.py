"""
VibeSync backend for Render (Python Flask).

Routes:
  GET  /api/health
  GET  /api/search?q=&limit=          - JioSaavn search
  GET  /api/home?lang=                - JioSaavn home (charts/albums/playlists)
  GET  /api/playlist?id=              - JioSaavn playlist tracks
  GET  /api/album?id=                 - JioSaavn album tracks
  GET  /api/artist?id= or ?name=      - JioSaavn artist top songs
  GET  /api/lyrics?title=&artist=     - LrcLib lyrics
  GET  /api/sp-token                  - Spotify anon token (test Render IP allowed)
  GET  /api/sp-search?q=&type=&limit= - Spotify search via anon
  GET  /api/sp-home?country=          - Spotify new-releases + featured
  GET  /api/sp-playlist?id=
  GET  /api/sp-album?id=
  GET  /api/sp-artist?id= or ?name=

Local dev:
  pip install -r requirements.txt
  python server.py
  -> http://localhost:8765

Deploy (Render):
  Build:  pip install -r requirements.txt
  Start:  gunicorn server:app
"""
import base64
import json
import os
import time
import urllib.parse
import urllib.request

from flask import Flask, jsonify, request, send_from_directory
from Crypto.Cipher import DES

app = Flask(__name__, static_folder=".", static_url_path="")

# ---------- Shared helpers ----------
DES_KEY = b"38346591"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120 Safari/537.36"
)


def decrypt_url(enc: str) -> str:
    try:
        cipher = DES.new(DES_KEY, DES.MODE_ECB)
        raw = base64.b64decode(enc)
        out = cipher.decrypt(raw)
        pad = out[-1]
        return out[:-pad].decode("utf-8", errors="ignore")
    except Exception:
        return ""


def upgrade_quality(url: str, quality: str = "320") -> str:
    if not url:
        return url
    if url.startswith("http://"):
        url = "https://" + url[7:]
    for q in ("_12", "_48", "_96", "_160"):
        url = url.replace(q + ".mp4", "_" + quality + ".mp4")
    return url


def big_img(url: str) -> str:
    return (url or "").replace("150x150", "500x500")


def clean(s: str) -> str:
    return (s or "").replace("&quot;", '"').replace("&amp;", "&").replace("&#039;", "'")


def fetch_json(url: str, headers: dict = None, timeout: int = 12) -> dict:
    req = urllib.request.Request(url, headers={**({"User-Agent": UA, "Accept": "application/json"}), **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8", errors="ignore"))


def jio(call: str, params: dict) -> dict:
    qs = urllib.parse.urlencode({
        "__call": call, "_format": "json", "_marker": "0",
        "api_version": "4", "ctx": "web6dot0", **params
    })
    return fetch_json(f"https://www.jiosaavn.com/api.php?{qs}")


def format_track(s: dict) -> dict:
    info = s.get("more_info", {}) or {}
    enc = info.get("encrypted_media_url") or ""
    stream = upgrade_quality(decrypt_url(enc), "320" if info.get("320kbps") == "true" else "160") if enc else ""
    artists = info.get("artistMap", {}).get("primary_artists", []) or []
    artist_name = ", ".join(a.get("name", "") for a in artists[:3]) or (s.get("subtitle") or "").split("-")[0].strip()
    artist_img = big_img(artists[0].get("image", "")) if artists else ""
    return {
        "id": s.get("id"),
        "title": clean(s.get("title")),
        "artist": clean(artist_name),
        "artist_id": (artists[0] or {}).get("id", ""),
        "artist_img": artist_img,
        "album": clean(info.get("album", "")),
        "album_id": info.get("album_id", ""),
        "img": big_img(s.get("image")),
        "url": stream,
        "duration": int(info.get("duration") or 0),
        "has_lyrics": info.get("has_lyrics") == "true",
        "source": "JioSaavn",
    }


# ---------- CORS ----------
@app.after_request
def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    resp.headers["Cache-Control"] = "public, s-maxage=180"
    return resp


@app.route("/api/<path:_>", methods=["OPTIONS"])
def options(_):
    return ("", 204)


# ---------- Health ----------
@app.route("/api/health")
def health():
    return jsonify(ok=True, service="vibesync", runtime="python-render")


# ---------- JioSaavn ----------
@app.route("/api/search")
def search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify(error="missing q", results=[]), 400
    try:
        limit = int(request.args.get("limit", 10))
        data = jio("search.getResults", {"p": "1", "q": q, "n": str(limit)})
        results = [format_track(s) for s in data.get("results", [])]
        return jsonify(results=[r for r in results if r["url"]])
    except Exception as e:
        return jsonify(error=str(e), results=[]), 500


@app.route("/api/home")
def home():
    lang = request.args.get("lang", "hindi,english")
    try:
        data = jio("content.getHomepageData", {"language": lang, "n": "1"})
        def map_tile(a, t):
            return {
                "id": a.get("id"),
                "title": clean(a.get("title")),
                "subtitle": clean(a.get("subtitle") or (a.get("more_info") or {}).get("music", "")),
                "img": big_img(a.get("image")),
                "type": t,
                "query": clean(a.get("title")),
            }
        return jsonify(
            new_albums=[map_tile(a, "album") for a in (data.get("new_albums") or [])[:12]],
            playlists=[map_tile(p, "playlist") for p in (data.get("featured_playlists") or data.get("top_playlists") or [])[:12]],
            charts=[map_tile(c, "chart") for c in (data.get("charts") or [])[:12]],
            genres=[{"title": clean(g.get("title") or g.get("name")), "img": big_img(g.get("image", "")), "query": clean(g.get("title") or g.get("name"))} for g in (data.get("genres") or [])[:8]],
        )
    except Exception as e:
        return jsonify(error=str(e), new_albums=[], playlists=[], charts=[], genres=[]), 500


@app.route("/api/playlist")
def playlist():
    pid = (request.args.get("id") or "").strip()
    if not pid:
        return jsonify(error="missing id"), 400
    try:
        d = jio("playlist.getDetails", {"listid": pid})
        tracks = [format_track(s) for s in (d.get("songs") or d.get("list") or [])]
        return jsonify(
            id=d.get("id"),
            title=clean(d.get("title") or d.get("listname", "")),
            img=big_img(d.get("image")),
            tracks=[t for t in tracks if t["url"]],
        )
    except Exception as e:
        return jsonify(error=str(e), tracks=[]), 500


@app.route("/api/album")
def album():
    aid = (request.args.get("id") or "").strip()
    if not aid:
        return jsonify(error="missing id"), 400
    try:
        d = jio("content.getAlbumDetails", {"albumid": aid})
        tracks = [format_track(s) for s in (d.get("songs") or d.get("list") or [])]
        return jsonify(
            id=d.get("id"),
            title=clean(d.get("title") or d.get("name", "")),
            img=big_img(d.get("image")),
            year=d.get("year", ""),
            tracks=[t for t in tracks if t["url"]],
        )
    except Exception as e:
        return jsonify(error=str(e), tracks=[]), 500


@app.route("/api/artist")
def artist():
    aid = (request.args.get("id") or "").strip()
    name = (request.args.get("name") or "").strip()
    if not aid and not name:
        return jsonify(error="need id or name"), 400
    try:
        if not aid and name:
            s = jio("search.getArtists", {"p": "1", "q": name, "n": "1"})
            aid = ((s.get("results") or [{}])[0]).get("id")
            if not aid:
                return jsonify(error="not found", top_songs=[]), 404
        d = jio("artist.getArtistPageDetails", {"artistId": aid})
        top = [format_track(s) for s in (d.get("topSongs") or [])]
        return jsonify(
            id=d.get("artistId", aid),
            name=clean(d.get("name", name)),
            img=big_img(d.get("image")),
            bio=clean(d.get("bio", "")),
            top_songs=[t for t in top if t["url"]],
        )
    except Exception as e:
        return jsonify(error=str(e), top_songs=[]), 500


# ---------- LrcLib ----------
@app.route("/api/lyrics")
def lyrics():
    title = (request.args.get("title") or "").strip()
    artist = (request.args.get("artist") or "").strip()
    if not title or not artist:
        return jsonify(error="need title+artist"), 400
    try:
        url = f"https://lrclib.net/api/get?artist_name={urllib.parse.quote(artist)}&track_name={urllib.parse.quote(title)}"
        try:
            d = fetch_json(url, headers={"User-Agent": "VibeSync/1.0"})
        except urllib.error.HTTPError as e:
            if e.code == 404:
                s = fetch_json(f"https://lrclib.net/api/search?q={urllib.parse.quote(artist + ' ' + title)}", headers={"User-Agent": "VibeSync/1.0"})
                if s and s[0]:
                    d = s[0]
                else:
                    return jsonify(plain="", synced="", source="none")
            else:
                raise
        return jsonify(
            plain=d.get("plainLyrics") or "",
            synced=d.get("syncedLyrics") or "",
            instrumental=d.get("instrumental") or False,
            source="LrcLib",
        )
    except Exception as e:
        return jsonify(error=str(e), plain="", synced=""), 500


# ---------- Spotify (anon token — test if Render IP works) ----------
_sp_token = {"v": None, "exp": 0}


def get_sp_token():
    if _sp_token["v"] and time.time() < _sp_token["exp"] - 60:
        return _sp_token["v"]
    d = fetch_json(
        "https://open.spotify.com/get_access_token?reason=transport&productType=embed",
        headers={"User-Agent": UA, "Accept": "application/json"},
    )
    _sp_token["v"] = d["accessToken"]
    _sp_token["exp"] = (d.get("accessTokenExpirationTimestampMs", 0) / 1000.0) or (time.time() + 3300)
    return _sp_token["v"]


def sp_api(path: str, params: dict = None) -> dict:
    tok = get_sp_token()
    qs = ("?" + urllib.parse.urlencode(params)) if params else ""
    return fetch_json(
        "https://api.spotify.com/v1" + path + qs,
        headers={"Authorization": "Bearer " + tok}
    )


def sp_track_tile(t: dict) -> dict:
    return {
        "id": t.get("id"),
        "title": t.get("name"),
        "subtitle": ", ".join(a.get("name", "") for a in (t.get("artists") or [])),
        "img": ((t.get("album") or {}).get("images") or [{}])[0].get("url", ""),
        "type": "sp-track",
        "query": f"{t.get('name', '')} {(t.get('artists') or [{}])[0].get('name', '')}".strip(),
    }


def sp_album_tile(a: dict) -> dict:
    return {
        "id": a.get("id"),
        "title": a.get("name"),
        "subtitle": ", ".join(x.get("name", "") for x in (a.get("artists") or [])),
        "img": (a.get("images") or [{}])[0].get("url", ""),
        "type": "sp-album",
        "query": f"{a.get('name', '')} {(a.get('artists') or [{}])[0].get('name', '')}".strip(),
    }


def sp_playlist_tile(p: dict) -> dict:
    return {
        "id": p.get("id"),
        "title": p.get("name"),
        "subtitle": p.get("description") or ("By " + ((p.get("owner") or {}).get("display_name", ""))),
        "img": (p.get("images") or [{}])[0].get("url", ""),
        "type": "sp-playlist",
        "query": p.get("name"),
    }


def sp_artist_tile(a: dict) -> dict:
    return {
        "id": a.get("id"),
        "title": a.get("name"),
        "subtitle": "Artist",
        "img": (a.get("images") or [{}])[0].get("url", ""),
        "type": "sp-artist",
        "query": a.get("name"),
    }


@app.route("/api/sp-token")
def sp_token_test():
    try:
        tok = get_sp_token()
        return jsonify(ok=True, token_preview=tok[:24] + "…", expires_in=int(_sp_token["exp"] - time.time()))
    except Exception as e:
        return jsonify(ok=False, error=str(e)), 500


@app.route("/api/sp-search")
def sp_search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify(error="missing q"), 400
    try:
        types = request.args.get("type", "track,artist,album,playlist")
        limit = int(request.args.get("limit", 8))
        d = sp_api("/search", {"q": q, "type": types, "limit": limit})
        return jsonify(
            tracks=[sp_track_tile(t) for t in (d.get("tracks") or {}).get("items", [])],
            artists=[sp_artist_tile(a) for a in (d.get("artists") or {}).get("items", [])],
            albums=[sp_album_tile(a) for a in (d.get("albums") or {}).get("items", []) if a],
            playlists=[sp_playlist_tile(p) for p in (d.get("playlists") or {}).get("items", []) if p],
        )
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route("/api/sp-home")
def sp_home():
    country = request.args.get("country", "US")
    limit = str(request.args.get("limit", 12))
    out = {"new_releases": [], "featured": [], "categories": [], "errors": []}
    try:
        nr = sp_api("/browse/new-releases", {"country": country, "limit": limit})
        out["new_releases"] = [sp_album_tile(a) for a in (nr.get("albums") or {}).get("items", [])]
    except Exception as e:
        out["errors"].append(f"new-releases: {e}")
    try:
        fp = sp_api("/browse/featured-playlists", {"country": country, "limit": limit})
        out["featured"] = [sp_playlist_tile(p) for p in (fp.get("playlists") or {}).get("items", []) if p]
        out["featured_msg"] = fp.get("message", "")
    except Exception as e:
        out["errors"].append(f"featured: {e}")
    try:
        cat = sp_api("/browse/categories", {"country": country, "limit": "20"})
        out["categories"] = [
            {"id": c.get("id"), "title": c.get("name"), "img": (c.get("icons") or [{}])[0].get("url", ""), "type": "sp-category", "query": c.get("name")}
            for c in (cat.get("categories") or {}).get("items", [])
        ]
    except Exception as e:
        out["errors"].append(f"categories: {e}")
    return jsonify(out)


@app.route("/api/sp-playlist")
def sp_playlist():
    pid = (request.args.get("id") or "").strip()
    if not pid:
        return jsonify(error="missing id"), 400
    try:
        p = sp_api(f"/playlists/{pid}", {"fields": "id,name,description,images,owner(display_name),tracks.items(track(id,name,artists,album(images,name),duration_ms))"})
        return jsonify(
            id=p.get("id"),
            title=p.get("name"),
            subtitle=p.get("description") or ("By " + ((p.get("owner") or {}).get("display_name", ""))),
            img=(p.get("images") or [{}])[0].get("url", ""),
            tracks=[sp_track_tile(i.get("track")) for i in ((p.get("tracks") or {}).get("items") or []) if i.get("track")],
        )
    except Exception as e:
        return jsonify(error=str(e), tracks=[]), 500


@app.route("/api/sp-album")
def sp_album_route():
    aid = (request.args.get("id") or "").strip()
    if not aid:
        return jsonify(error="missing id"), 400
    try:
        a = sp_api(f"/albums/{aid}")
        tracks = []
        for t in (a.get("tracks") or {}).get("items", []):
            t["album"] = {"images": a.get("images", []), "name": a.get("name")}
            tracks.append(sp_track_tile(t))
        return jsonify(
            id=a.get("id"),
            title=a.get("name"),
            subtitle=", ".join(x.get("name", "") for x in (a.get("artists") or [])),
            img=(a.get("images") or [{}])[0].get("url", ""),
            year=(a.get("release_date") or "")[:4],
            tracks=tracks,
        )
    except Exception as e:
        return jsonify(error=str(e), tracks=[]), 500


@app.route("/api/sp-artist")
def sp_artist_route():
    aid = (request.args.get("id") or "").strip()
    name = (request.args.get("name") or "").strip()
    try:
        if not aid and name:
            s = sp_api("/search", {"q": name, "type": "artist", "limit": 1})
            aid = (((s.get("artists") or {}).get("items") or [{}])[0]).get("id")
            if not aid:
                return jsonify(error="not found"), 404
        if not aid:
            return jsonify(error="need id or name"), 400
        a = sp_api(f"/artists/{aid}")
        try:
            top = sp_api(f"/artists/{aid}/top-tracks", {"market": "US"})
        except Exception:
            top = {"tracks": []}
        try:
            albums = sp_api(f"/artists/{aid}/albums", {"include_groups": "album,single", "limit": "20", "market": "US"})
        except Exception:
            albums = {"items": []}
        return jsonify(
            id=a.get("id"),
            name=a.get("name"),
            img=(a.get("images") or [{}])[0].get("url", ""),
            follower_count=(a.get("followers") or {}).get("total", 0),
            genres=a.get("genres", []),
            top_tracks=[sp_track_tile(t) for t in (top.get("tracks") or [])],
            albums=[sp_album_tile(x) for x in (albums.get("items") or [])],
        )
    except Exception as e:
        return jsonify(error=str(e)), 500


# ---------- Static fallback (for local dev only) ----------
@app.route("/")
def root():
    return send_from_directory(".", "presplash.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8765))
    app.run(host="0.0.0.0", port=port, debug=False)
