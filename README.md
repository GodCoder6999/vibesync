# VibeSync

Spotify-style web music app. Full 320kbps streams via JioSaavn proxy. Personalized onboarding (signup → language → artists → genres). Real album art, search, fullscreen now-playing overlay.

## Stack
- Static HTML / CSS / JS frontend
- Python serverless proxy (`/api/search`) — DES-decrypts JioSaavn `encrypted_media_url`, returns direct mp4 stream URL + cover + artist photo
- iTunes Search + Audius as audio fallbacks

## Deploy (Vercel)
1. Fork or import this repo at https://vercel.com/new
2. No build settings needed — Vercel detects static + `/api/*.py` Python runtime
3. Deploy

## Local dev
```bash
pip install -r requirements.txt
python serve.py
# open http://localhost:8765
```

## Routes
| Path | What |
|---|---|
| `/presplash.html` | splash → routes to welcome or home |
| `/welcome.html` | 4-step onboarding (signup → language → artists → genres) |
| `/index.html` | personalized home |
| `/explore.html` | Browse all genres |
| `/library.html` | Your Library |
| `/player.html` | Immersive player route |
| `/api/search?q=` | JioSaavn proxy (full 320kbps mp4 + artist photo) |
| `/api/health` | uptime ping |

## Tech notes
- OAuth not used. JioSaavn endpoint is public.
- Storage: `localStorage.vs_user`, `vs_prefs`, `vs_prefs_full`
- Per-pref section render cached in `sessionStorage`
- Mini-player audio = single `Audio()` instance shared across pages via `window.vsAudio`
