"""
VibeSync backend for Render (Python Flask).

Routes:
  GET  /api/health
  GET  /api/search?q=&limit=          - JioSaavn search (audio source)
  GET  /api/home?lang=                - JioSaavn home (charts/albums/playlists)
  GET  /api/playlist?id=              - JioSaavn playlist tracks
  GET  /api/album?id=                 - JioSaavn album tracks
  GET  /api/artist?id= or ?name=      - JioSaavn artist top songs
  GET  /api/lyrics?title=&artist=     - LrcLib lyrics

  GET  /api/rx-home                   - Spotify curated home (RapidAPI)
  GET  /api/rx-playlist?id=           - Spotify playlist (RapidAPI)
  GET  /api/rx-album?id=              - Spotify album (RapidAPI)
  GET  /api/rx-artist?id=             - Spotify artist (RapidAPI)
  GET  /api/rx-track?id=              - Spotify track (RapidAPI)

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


# ---------- Spotify via SpotAPI (unofficial scraper) ----------
# All metadata + covers come from real Spotify catalog. Audio still JioSaavn.
# SpotAPI scrapes Spotify's public web endpoints; may rate-limit on cloud IPs.

_sx_cache = {}  # id -> normalized dict (cuts duplicate scrapes)


def _is_url(s) -> bool:
    return isinstance(s, str) and (s.startswith("http://") or s.startswith("https://"))


def _sx_img(obj) -> str:
    """Extract a real http(s) image URL from Spotify GraphQL shapes.

    Handles:
      - {url: "https://..."}
      - {images: {items: [{sources: [{url, width, height}]}]}}  (modern GraphQL)
      - {images: [{url, ...}]}                                  (REST style)
      - {coverArt: {sources: [{url, ...}]}}                     (track cover)
      - direct list/string fallbacks
    """
    if not obj:
        return ""
    if isinstance(obj, str):
        return obj if _is_url(obj) else ""
    if isinstance(obj, list):
        for el in obj:
            got = _sx_img(el)
            if got:
                return got
        return ""
    if isinstance(obj, dict):
        # Direct url
        if _is_url(obj.get("url")):
            return obj["url"]
        # sources[].url shape (most common in GraphQL)
        srcs = obj.get("sources")
        if isinstance(srcs, list):
            for s in srcs:
                u = (s.get("url") if isinstance(s, dict) else None)
                if _is_url(u):
                    return u
        # images can be either list or {items: []}
        imgs = obj.get("images") or obj.get("image")
        if isinstance(imgs, dict):
            return _sx_img(imgs.get("items") or imgs.get("sources") or imgs)
        if isinstance(imgs, list):
            return _sx_img(imgs)
        # coverArt / avatarImage etc — nested objects with sources
        for k in ("coverArt", "avatarImage", "headerImage", "thumbnail", "picture", "img"):
            v = obj.get(k)
            if v:
                got = _sx_img(v)
                if got:
                    return got
        # items[] of objects with sources
        items = obj.get("items")
        if isinstance(items, list):
            return _sx_img(items)
    return ""


def _sx_artists(t) -> str:
    """Join artist names from Spotify GraphQL track shape.

    Modern shape:  t.artists.items[].profile.name
    Older shape:   t.artists[].name
    """
    if not isinstance(t, dict):
        return ""
    arr_holder = t.get("artists") or t.get("artist")
    out = []
    if isinstance(arr_holder, dict):
        items = arr_holder.get("items") or []
        for a in items:
            if isinstance(a, dict):
                n = ((a.get("profile") or {}).get("name") if isinstance(a.get("profile"), dict) else None) or a.get("name")
                if n:
                    out.append(n)
    elif isinstance(arr_holder, list):
        for a in arr_holder:
            if isinstance(a, dict):
                n = ((a.get("profile") or {}).get("name") if isinstance(a.get("profile"), dict) else None) or a.get("name")
                if n:
                    out.append(n)
            elif isinstance(a, str):
                out.append(a)
    elif isinstance(arr_holder, str):
        out.append(arr_holder)
    return ", ".join(x for x in out if x)


def _sx_duration_ms(t: dict) -> int:
    """Pick duration in ms from any plausible field."""
    if not isinstance(t, dict):
        return 0
    # Modern GraphQL: trackDuration.totalMilliseconds
    td = t.get("trackDuration")
    if isinstance(td, dict):
        v = td.get("totalMilliseconds") or td.get("milliseconds") or 0
        if v:
            return int(v)
    for k in ("duration_ms", "durationMs", "durationMilliseconds"):
        v = t.get(k)
        if v:
            return int(v)
    v = t.get("duration")
    if isinstance(v, (int, float)):
        return int(v) if v >= 1000 else int(v) * 1000
    return 0


def _sx_track_to_tile(t: dict, idx: int = 0) -> dict:
    if not isinstance(t, dict):
        return None
    # Common GraphQL wrappers — unwrap to actual track data
    if isinstance(t.get("itemV2"), dict) and isinstance(t["itemV2"].get("data"), dict):
        t = t["itemV2"]["data"]
    if isinstance(t.get("item"), dict) and isinstance(t["item"].get("data"), dict):
        t = t["item"]["data"]
    if "track" in t and isinstance(t["track"], dict):
        t = t["track"]

    name = t.get("name") or t.get("title") or ""
    if not name:
        return None

    artists = _sx_artists(t)

    # Album: modern GraphQL uses albumOfTrack; legacy uses album
    album = t.get("albumOfTrack") if isinstance(t.get("albumOfTrack"), dict) else (
        t.get("album") if isinstance(t.get("album"), dict) else {}
    )
    album_name = album.get("name") or album.get("title") or ""
    album_img = _sx_img(album) or _sx_img(t)

    dur_ms = _sx_duration_ms(t)

    tid = t.get("id") or ""
    if not tid:
        uri = t.get("uri") or ""
        tid = uri.split(":")[-1] if uri else ""

    return {
        "id": tid,
        "title": name,
        "artist": artists,
        "album": album_name,
        "img": album_img,
        "duration": dur_ms // 1000 if dur_ms else 0,
        "query": f"{name} {artists}".strip(),
        "source": "Spotify",
    }


def _spotapi():
    """Lazy import — keeps boot fast and lets server start even if SpotAPI fails."""
    import importlib
    return importlib.import_module("spotapi")


@app.route("/api/sx-health")
def sx_health():
    try:
        sa = _spotapi()
        return jsonify(ok=True, version=getattr(sa, "__version__", "unknown"))
    except Exception as e:
        return jsonify(ok=False, error=str(e)), 500


@app.route("/api/sx-search")
def sx_search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify(error="missing q"), 400
    limit = int(request.args.get("limit", 10))
    try:
        sa = _spotapi()
        song = sa.Song()
        data = song.query_songs(q, limit=limit)
        items = data.get("data", {}).get("searchV2", {}).get("tracksV2", {}).get("items", []) if isinstance(data, dict) else []
        if not items:
            items = data.get("tracks", []) if isinstance(data, dict) else []
        tracks = []
        for i, it in enumerate(items[:limit]):
            t = it.get("item", {}).get("data") if isinstance(it.get("item"), dict) else it
            tile = _sx_track_to_tile(t, i)
            if tile:
                tracks.append(tile)
        return jsonify(tracks=tracks)
    except Exception as e:
        return jsonify(error=str(e), tracks=[]), 500


@app.route("/api/sx-playlist")
def sx_playlist():
    pid = (request.args.get("id") or "").strip()
    if not pid:
        return jsonify(error="missing id"), 400
    if pid in _sx_cache:
        return jsonify(_sx_cache[pid])
    try:
        sa = _spotapi()
        pl = sa.PublicPlaylist(pid) if hasattr(sa, "PublicPlaylist") else sa.Playlist(pid)
        info = pl.get_playlist_info(limit=100) if hasattr(pl, "get_playlist_info") else pl.get_info()
        # SpotAPI returns nested GraphQL shape
        root = info.get("data", {}).get("playlistV2") if isinstance(info, dict) else None
        if not root:
            root = info if isinstance(info, dict) else {}
        items_raw = (((root.get("content") or {}).get("items")) or root.get("tracks") or root.get("items") or [])
        if isinstance(items_raw, dict):
            items_raw = items_raw.get("items") or []
        tracks = []
        for i, it in enumerate(items_raw):
            t = (it.get("itemV2", {}).get("data") if isinstance(it.get("itemV2"), dict) else None) or it.get("track") or it
            tile = _sx_track_to_tile(t, i)
            if tile:
                tracks.append(tile)
        # Owner: modern GraphQL = ownerV2.data.name; legacy = owner.display_name / owner.name
        owner_name = ""
        ov2 = root.get("ownerV2")
        if isinstance(ov2, dict) and isinstance(ov2.get("data"), dict):
            owner_name = ov2["data"].get("name") or ""
        if not owner_name and isinstance(root.get("owner"), dict):
            owner_name = root["owner"].get("display_name") or root["owner"].get("name") or ""

        out = {
            "id": pid,
            "title": root.get("name") or root.get("title") or "",
            "subtitle": (root.get("description") or "") if isinstance(root.get("description"), str) else "",
            "img": _sx_img(root),
            "owner": owner_name,
            "tracks": tracks,
        }
        _sx_cache[pid] = out
        return jsonify(out)
    except Exception as e:
        return jsonify(error=str(e), tracks=[]), 500


@app.route("/api/sx-album")
def sx_album():
    aid = (request.args.get("id") or "").strip()
    if not aid:
        return jsonify(error="missing id"), 400
    if aid in _sx_cache:
        return jsonify(_sx_cache[aid])
    try:
        sa = _spotapi()
        alb = sa.Album(aid)
        info = alb.get_album_info() if hasattr(alb, "get_album_info") else alb.get_info()
        root = info.get("data", {}).get("albumUnion") if isinstance(info, dict) else None
        if not root:
            root = info if isinstance(info, dict) else {}
        tracks_raw = (((root.get("tracksV2") or root.get("tracks") or {}).get("items")) or root.get("items") or [])
        tracks = []
        for i, it in enumerate(tracks_raw):
            t = (it.get("track") if isinstance(it.get("track"), dict) else None) or it.get("itemV2", {}).get("data") or it
            tile = _sx_track_to_tile(t, i)
            if tile:
                if not tile["img"]:
                    tile["img"] = _sx_img(root.get("coverArt") or root.get("images") or root.get("image") or {})
                if not tile["album"]:
                    tile["album"] = root.get("name") or root.get("title") or ""
                tracks.append(tile)
        out = {
            "id": aid,
            "title": root.get("name") or root.get("title") or "",
            "subtitle": _sx_artists(root),
            "img": _sx_img(root.get("coverArt") or root.get("images") or root.get("image") or {}),
            "year": str(root.get("date", {}).get("year") if isinstance(root.get("date"), dict) else root.get("releaseDate", "") or "")[:4],
            "tracks": tracks,
        }
        _sx_cache[aid] = out
        return jsonify(out)
    except Exception as e:
        return jsonify(error=str(e), tracks=[]), 500


@app.route("/api/sx-artist")
def sx_artist():
    aid = (request.args.get("id") or "").strip()
    name = (request.args.get("name") or "").strip()
    if not aid and not name:
        return jsonify(error="need id or name"), 400
    key = aid or f"name:{name}"
    if key in _sx_cache:
        return jsonify(_sx_cache[key])
    try:
        sa = _spotapi()
        if not aid and name:
            song = sa.Song()
            data = song.query_artists(name, limit=1) if hasattr(song, "query_artists") else song.query_songs(name, limit=1)
            # Try to extract first artist id
            try:
                items = data["data"]["searchV2"]["artists"]["items"]
                aid = items[0]["data"]["uri"].split(":")[-1]
            except Exception:
                pass
            if not aid:
                return jsonify(error="not found"), 404
        ar = sa.Artist(aid)
        info = ar.get_artist_info() if hasattr(ar, "get_artist_info") else ar.get_info()
        root = info.get("data", {}).get("artistUnion") if isinstance(info, dict) else None
        if not root:
            root = info if isinstance(info, dict) else {}
        profile = root.get("profile") or {}
        visuals = root.get("visuals") or {}
        stats = root.get("stats") or {}
        # Top tracks
        top_raw = (((root.get("discography") or {}).get("topTracks") or {}).get("items")) or root.get("topTracks") or []
        top = []
        for i, it in enumerate(top_raw):
            t = (it.get("track") if isinstance(it.get("track"), dict) else None) or it
            tile = _sx_track_to_tile(t, i)
            if tile:
                top.append(tile)
        # Albums
        disco = (root.get("discography") or {})
        albums_raw = ((disco.get("albums") or {}).get("items")) or []
        albums = []
        for a in albums_raw:
            rel = (a.get("releases") or {}).get("items") or [a]
            for r in rel[:1]:
                albums.append({
                    "id": (r.get("uri") or "").split(":")[-1],
                    "title": r.get("name") or "",
                    "subtitle": str((r.get("date") or {}).get("year") or "")[:4] or "Album",
                    "img": _sx_img(r.get("coverArt") or {}),
                    "type": "sx-album",
                })
        out = {
            "id": aid,
            "name": profile.get("name") or name or "",
            "img": _sx_img(visuals.get("avatarImage") or visuals.get("headerImage") or root.get("images") or {}),
            "bio": (profile.get("biography") or {}).get("text") if isinstance(profile.get("biography"), dict) else "",
            "follower_count": int(stats.get("followers") or 0),
            "genres": [],
            "top_songs": top,
            "albums": albums,
        }
        _sx_cache[key] = out
        return jsonify(out)
    except Exception as e:
        return jsonify(error=str(e), top_songs=[], albums=[]), 500


# Curated Spotify catalogue for the home page.
CURATED_PLAYLISTS = [
    ("37i9dQZF1DXcBWIGoYBM5M", "Today's Top Hits"),
    ("37i9dQZF1DX0XUsuxWHRQd", "RapCaviar"),
    ("37i9dQZF1DX4WYpdgoIcn6", "Chill Hits"),
    ("37i9dQZF1DX3rxVfibe1L0", "Mood Booster"),
    ("37i9dQZEVXbMDoHDwVN2tF", "Top 50 - Global"),
    ("37i9dQZEVXbLRQDuF5jeBp", "Top 50 - USA"),
    ("37i9dQZF1DX1lVhptIYRda", "Hot Country"),
    ("37i9dQZF1DXcF6B6QPhFDv", "Rock This"),
    ("37i9dQZF1DX10zKzsJ2jva", "Viva Latino"),
    ("37i9dQZF1DX0XUfTFmNBRM", "Bollywood Top 50"),
    ("37i9dQZF1DX5q67ZpWyRrZ", "Pop Rising"),
    ("37i9dQZF1DXbTxeAdrVG2l", "All Out 90s"),
]
CURATED_ARTISTS = [
    ("3TVXtAsR1Inumwj472S9r4", "Drake"),
    ("1Xyo4u8uXC1ZmMpatF05PJ", "The Weeknd"),
    ("06HL4z0CvFAxyc27GXpf02", "Taylor Swift"),
    ("4q3ewBCX7sLwd24euuV69X", "Bad Bunny"),
    ("6eUKZXaKkcviH0Ku9w2n3V", "Ed Sheeran"),
    ("4YRxDV8wJFPHPTeXepOstw", "Arijit Singh"),
    ("66CXWjxzNUsdJxJ2JdwvnR", "Ariana Grande"),
    ("1uNFoZAHBGtllmzznpCI3s", "Justin Bieber"),
]


def _prewarm_curated():
    """Background fetch of all curated playlist + artist details so first
    home load hits warm cache (instant covers)."""
    import threading
    def worker():
        try:
            sa = _spotapi()
        except Exception as e:
            print(f"[prewarm] spotapi import fail: {e}", flush=True)
            return
        for pid, name in CURATED_PLAYLISTS:
            key = f"pl:{pid}"
            if key in _sx_cache:
                continue
            try:
                pl = sa.PublicPlaylist(pid)
                info = pl.get_playlist_info(limit=100)
                root = (info.get("data") or {}).get("playlistV2") or info or {}
                items_raw = ((root.get("content") or {}).get("items")) or []
                tracks = []
                for i, it in enumerate(items_raw):
                    t = (it.get("itemV2", {}).get("data") if isinstance(it.get("itemV2"), dict) else None) or it.get("track") or it
                    tile = _sx_track_to_tile(t, i)
                    if tile:
                        tracks.append(tile)
                owner_name = ""
                ov2 = root.get("ownerV2")
                if isinstance(ov2, dict) and isinstance(ov2.get("data"), dict):
                    owner_name = ov2["data"].get("name") or ""
                _sx_cache[key] = {
                    "id": pid,
                    "title": root.get("name") or name,
                    "subtitle": (root.get("description") or "") if isinstance(root.get("description"), str) else "",
                    "img": _sx_img(root),
                    "owner": owner_name,
                    "tracks": tracks,
                }
                print(f"[prewarm] cached playlist {pid} ({len(tracks)} tracks)", flush=True)
            except Exception as e:
                print(f"[prewarm] playlist {pid} fail: {e}", flush=True)
        for aid, name in CURATED_ARTISTS:
            key = f"ar:{aid}"
            if key in _sx_cache:
                continue
            try:
                ar = sa.Artist(aid)
                info = ar.get_artist_info()
                root = (info.get("data") or {}).get("artistUnion") or info or {}
                profile = root.get("profile") or {}
                visuals = root.get("visuals") or {}
                stats = root.get("stats") or {}
                disco = root.get("discography") or {}
                top_raw = ((disco.get("topTracks") or {}).get("items")) or []
                top = []
                for i, it in enumerate(top_raw):
                    t = (it.get("track") if isinstance(it.get("track"), dict) else None) or it
                    tile = _sx_track_to_tile(t, i)
                    if tile:
                        top.append(tile)
                albums_raw = ((disco.get("albums") or {}).get("items")) or []
                albums = []
                for a in albums_raw:
                    rel = (a.get("releases") or {}).get("items") or [a]
                    for r in rel[:1]:
                        albums.append({
                            "id": (r.get("uri") or "").split(":")[-1],
                            "title": r.get("name") or "",
                            "subtitle": str((r.get("date") or {}).get("year") or "")[:4] or "Album",
                            "img": _sx_img(r.get("coverArt") or {}),
                            "type": "sx-album",
                        })
                _sx_cache[key] = {
                    "id": aid,
                    "name": profile.get("name") or name,
                    "img": _sx_img(visuals.get("avatarImage") or visuals.get("headerImage") or {}),
                    "bio": (profile.get("biography") or {}).get("text") if isinstance(profile.get("biography"), dict) else "",
                    "follower_count": int(stats.get("followers") or 0),
                    "genres": [],
                    "top_songs": top,
                    "albums": albums,
                }
                print(f"[prewarm] cached artist {aid} ({len(top)} top, {len(albums)} albums)", flush=True)
            except Exception as e:
                print(f"[prewarm] artist {aid} fail: {e}", flush=True)
    threading.Thread(target=worker, daemon=True).start()


# Kick prewarm on import (Gunicorn worker boot).
_prewarm_curated()


@app.route("/api/sx-home")
def sx_home():
    """Returns curated tile list (Spotify IDs). Frontend fetches details on click."""
    return jsonify(
        playlists=[
            {"id": pid, "title": name, "subtitle": "Playlist",
             "img": "", "type": "sx-playlist", "query": name}
            for pid, name in CURATED_PLAYLISTS
        ],
        artists=[
            {"id": aid, "title": name, "subtitle": "Artist",
             "img": "", "type": "sx-artist", "query": name}
            for aid, name in CURATED_ARTISTS
        ],
    )


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


# ---------- Spotify-shaped shim (/sp/v1/*) for React clone frontend ----------
# Returns JioSaavn data wrapped in Spotify Web API response shape so the cloned
# Spotify React frontend can use it unmodified.

def jio_track_to_sp(t: dict, idx: int = 0) -> dict:
    """Convert our internal JioSaavn track → Spotify Track shape."""
    return {
        "id": t.get("id", ""),
        "name": t.get("title", ""),
        "uri": f"spotify:track:{t.get('id', '')}",
        "preview_url": t.get("url"),
        "duration_ms": (t.get("duration") or 0) * 1000,
        "explicit": False,
        "popularity": 50,
        "track_number": idx + 1,
        "disc_number": 1,
        "is_local": False,
        "type": "track",
        "external_urls": {},
        "external_ids": {},
        "available_markets": ["US"],
        "artists": [{
            "id": t.get("artist_id", ""),
            "name": t.get("artist", ""),
            "uri": f"spotify:artist:{t.get('artist_id', '')}",
            "type": "artist",
            "external_urls": {},
            "href": "",
        }],
        "album": {
            "id": t.get("album_id", ""),
            "name": t.get("album", ""),
            "uri": f"spotify:album:{t.get('album_id', '')}",
            "type": "album",
            "album_type": "album",
            "images": [{"url": t.get("img", ""), "height": 500, "width": 500}],
            "release_date": "",
            "release_date_precision": "year",
            "artists": [],
            "external_urls": {},
            "total_tracks": 1,
        },
        "href": "",
    }


def jio_album_to_sp(a: dict) -> dict:
    return {
        "id": a.get("id", ""),
        "name": a.get("title", ""),
        "uri": f"spotify:album:{a.get('id', '')}",
        "type": "album",
        "album_type": "album",
        "images": [{"url": a.get("img", ""), "height": 500, "width": 500}],
        "release_date": str(a.get("year", "") or ""),
        "release_date_precision": "year",
        "total_tracks": 0,
        "artists": [{"id": "", "name": a.get("subtitle", ""), "uri": "", "type": "artist", "external_urls": {}}],
        "external_urls": {},
        "href": "",
    }


def jio_playlist_to_sp(p: dict) -> dict:
    return {
        "id": p.get("id", ""),
        "name": p.get("title", ""),
        "uri": f"spotify:playlist:{p.get('id', '')}",
        "type": "playlist",
        "public": True,
        "collaborative": False,
        "description": p.get("subtitle", "") or "",
        "images": [{"url": p.get("img", ""), "height": 300, "width": 300}],
        "tracks": {"total": 0, "href": ""},
        "owner": {"id": "vibesync", "display_name": "VibeSync", "type": "user", "uri": "", "external_urls": {}},
        "external_urls": {},
        "href": "",
        "snapshot_id": "",
    }


def _paginate(items, limit=20, offset=0):
    return {
        "items": items[offset:offset + limit],
        "total": len(items),
        "limit": limit,
        "offset": offset,
        "next": None,
        "previous": None,
        "href": "",
    }


@app.route("/sp/v1/search")
def sp_v1_search():
    q = (request.args.get("q") or "").strip()
    types = (request.args.get("type") or "track,artist,album,playlist").split(",")
    limit = int(request.args.get("limit", 10))
    if not q:
        return jsonify(error={"status": 400, "message": "missing q"}), 400
    try:
        # Search JioSaavn songs + map
        data = jio("search.getResults", {"p": "1", "q": q, "n": str(limit)})
        tracks = [format_track(s) for s in data.get("results", [])]
        sp_tracks = [jio_track_to_sp(t, i) for i, t in enumerate(tracks) if t["url"]]

        # Search albums
        sp_albums = []
        if "album" in types:
            try:
                ad = jio("search.getAlbumResults", {"p": "1", "q": q, "n": str(limit)})
                for a in (ad.get("results") or [])[:limit]:
                    sp_albums.append(jio_album_to_sp({
                        "id": a.get("id"), "title": clean(a.get("title")),
                        "subtitle": clean(a.get("more_info", {}).get("music", "") or a.get("subtitle", "")),
                        "img": big_img(a.get("image")), "year": a.get("year", ""),
                    }))
            except Exception:
                pass

        # Search playlists
        sp_pls = []
        if "playlist" in types:
            try:
                pd = jio("search.getPlaylistResults", {"p": "1", "q": q, "n": str(limit)})
                for p in (pd.get("results") or [])[:limit]:
                    sp_pls.append(jio_playlist_to_sp({
                        "id": p.get("id"), "title": clean(p.get("title")),
                        "subtitle": clean(p.get("subtitle", "")), "img": big_img(p.get("image")),
                    }))
            except Exception:
                pass

        # Search artists
        sp_artists = []
        if "artist" in types:
            try:
                ar = jio("search.getArtists", {"p": "1", "q": q, "n": str(limit)})
                for a in (ar.get("results") or [])[:limit]:
                    sp_artists.append({
                        "id": a.get("id", ""),
                        "name": clean(a.get("name", a.get("title", ""))),
                        "uri": f"spotify:artist:{a.get('id', '')}",
                        "type": "artist",
                        "images": [{"url": big_img(a.get("image", "")), "height": 500, "width": 500}],
                        "followers": {"total": 0, "href": None},
                        "genres": [],
                        "popularity": 50,
                        "external_urls": {},
                        "href": "",
                    })
            except Exception:
                pass

        return jsonify(
            tracks=_paginate(sp_tracks, limit),
            albums=_paginate(sp_albums, limit),
            playlists=_paginate(sp_pls, limit),
            artists=_paginate(sp_artists, limit),
        )
    except Exception as e:
        return jsonify(error={"status": 500, "message": str(e)}), 500


@app.route("/sp/v1/browse/new-releases")
def sp_v1_new_releases():
    limit = int(request.args.get("limit", 20))
    try:
        data = jio("content.getHomepageData", {"language": "hindi,english", "n": "1"})
        items = []
        for a in (data.get("new_albums") or [])[:limit]:
            items.append(jio_album_to_sp({
                "id": a.get("id"), "title": clean(a.get("title")),
                "subtitle": clean(a.get("subtitle", "")), "img": big_img(a.get("image")),
                "year": a.get("year", ""),
            }))
        return jsonify(albums=_paginate(items, limit))
    except Exception as e:
        return jsonify(albums=_paginate([], limit), error={"status": 500, "message": str(e)})


@app.route("/sp/v1/browse/featured-playlists")
def sp_v1_featured():
    limit = int(request.args.get("limit", 20))
    try:
        data = jio("content.getHomepageData", {"language": "hindi,english", "n": "1"})
        items = []
        for p in ((data.get("featured_playlists") or data.get("top_playlists")) or [])[:limit]:
            items.append(jio_playlist_to_sp({
                "id": p.get("id"), "title": clean(p.get("title")),
                "subtitle": clean(p.get("subtitle", "")), "img": big_img(p.get("image")),
            }))
        return jsonify(message="Featured", playlists=_paginate(items, limit))
    except Exception as e:
        return jsonify(message="Featured", playlists=_paginate([], limit), error={"status": 500, "message": str(e)})


@app.route("/sp/v1/browse/categories")
def sp_v1_categories():
    limit = int(request.args.get("limit", 30))
    try:
        data = jio("content.getHomepageData", {"language": "hindi,english", "n": "1"})
        items = []
        for c in (data.get("charts") or [])[:limit]:
            items.append({
                "id": c.get("id", ""),
                "name": clean(c.get("title", "")),
                "icons": [{"url": big_img(c.get("image", "")), "height": 300, "width": 300}],
                "href": "",
            })
        return jsonify(categories=_paginate(items, limit))
    except Exception as e:
        return jsonify(categories=_paginate([], limit), error={"status": 500, "message": str(e)})


@app.route("/sp/v1/playlists/<pid>")
def sp_v1_playlist(pid):
    try:
        d = jio("playlist.getDetails", {"listid": pid})
        tracks = [format_track(s) for s in (d.get("songs") or d.get("list") or [])]
        sp_tracks = [jio_track_to_sp(t, i) for i, t in enumerate(tracks) if t["url"]]
        return jsonify({
            "id": d.get("id", pid),
            "name": clean(d.get("title") or d.get("listname", "")),
            "uri": f"spotify:playlist:{pid}",
            "type": "playlist",
            "public": True,
            "collaborative": False,
            "description": clean(d.get("subtitle", "") or ""),
            "images": [{"url": big_img(d.get("image", "")), "height": 300, "width": 300}],
            "owner": {"id": "vibesync", "display_name": "VibeSync", "type": "user", "uri": "", "external_urls": {}},
            "tracks": {
                "items": [{"added_at": "", "added_by": None, "is_local": False, "track": t} for t in sp_tracks],
                "total": len(sp_tracks),
                "limit": len(sp_tracks),
                "offset": 0,
                "next": None,
                "previous": None,
                "href": "",
            },
            "external_urls": {},
            "href": "",
            "snapshot_id": "",
        })
    except Exception as e:
        return jsonify(error={"status": 500, "message": str(e)}), 500


@app.route("/sp/v1/playlists/<pid>/tracks")
def sp_v1_playlist_tracks(pid):
    limit = int(request.args.get("limit", 50))
    try:
        d = jio("playlist.getDetails", {"listid": pid})
        tracks = [format_track(s) for s in (d.get("songs") or d.get("list") or [])]
        sp_tracks = [jio_track_to_sp(t, i) for i, t in enumerate(tracks) if t["url"]]
        items = [{"added_at": "", "added_by": None, "is_local": False, "track": t} for t in sp_tracks]
        return jsonify(_paginate(items, limit))
    except Exception as e:
        return jsonify(_paginate([], limit, 0), error={"status": 500, "message": str(e)})


@app.route("/sp/v1/albums/<aid>")
def sp_v1_album(aid):
    try:
        d = jio("content.getAlbumDetails", {"albumid": aid})
        tracks = [format_track(s) for s in (d.get("songs") or d.get("list") or [])]
        sp_tracks = [jio_track_to_sp(t, i) for i, t in enumerate(tracks) if t["url"]]
        return jsonify({
            "id": d.get("id", aid),
            "name": clean(d.get("title") or d.get("name", "")),
            "uri": f"spotify:album:{aid}",
            "type": "album",
            "album_type": "album",
            "images": [{"url": big_img(d.get("image", "")), "height": 500, "width": 500}],
            "release_date": str(d.get("year", "") or ""),
            "release_date_precision": "year",
            "total_tracks": len(sp_tracks),
            "artists": [],
            "tracks": {
                "items": sp_tracks,
                "total": len(sp_tracks), "limit": len(sp_tracks), "offset": 0,
                "next": None, "previous": None, "href": "",
            },
            "external_urls": {},
            "href": "",
        })
    except Exception as e:
        return jsonify(error={"status": 500, "message": str(e)}), 500


@app.route("/sp/v1/artists/<aid>")
def sp_v1_artist(aid):
    try:
        d = jio("artist.getArtistPageDetails", {"artistId": aid})
        return jsonify({
            "id": d.get("artistId", aid),
            "name": clean(d.get("name", "")),
            "uri": f"spotify:artist:{aid}",
            "type": "artist",
            "images": [{"url": big_img(d.get("image", "")), "height": 500, "width": 500}],
            "followers": {"total": int(d.get("follower_count", 0) or 0), "href": None},
            "genres": [],
            "popularity": 70,
            "external_urls": {},
            "href": "",
        })
    except Exception as e:
        return jsonify(error={"status": 500, "message": str(e)}), 500


@app.route("/sp/v1/artists/<aid>/top-tracks")
def sp_v1_artist_top(aid):
    try:
        d = jio("artist.getArtistPageDetails", {"artistId": aid})
        tracks = [format_track(s) for s in (d.get("topSongs") or [])]
        sp_tracks = [jio_track_to_sp(t, i) for i, t in enumerate(tracks) if t["url"]]
        return jsonify(tracks=sp_tracks)
    except Exception as e:
        return jsonify(tracks=[], error={"status": 500, "message": str(e)})


@app.route("/sp/v1/me")
def sp_v1_me():
    return jsonify({
        "id": "vibesync_user",
        "display_name": "VibeSync Listener",
        "email": "",
        "country": "US",
        "product": "open",
        "type": "user",
        "uri": "spotify:user:vibesync_user",
        "images": [{"url": "https://www.gravatar.com/avatar/?d=mp&s=200", "height": 200, "width": 200}],
        "followers": {"total": 0, "href": None},
        "external_urls": {},
        "href": "",
    })


# ---------- Static fallback (for local dev only) ----------
@app.route("/")
def root():
    return send_from_directory(".", "presplash.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8765))
    app.run(host="0.0.0.0", port=port, debug=False)
