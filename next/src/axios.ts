// VibeSync axios — points at our Render backend instead of api.spotify.com.
// Backend exposes Spotify-shaped routes under /sp/v1/* that proxy JioSaavn.
import Axios from 'axios';

const path = (process.env.REACT_APP_API_BASE || 'https://vibesync-4y9t.onrender.com') + '/sp/v1';

const axios = Axios.create({
  baseURL: path,
  headers: {},
});

// No auth needed — backend is open.

export default axios;
