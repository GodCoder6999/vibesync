// VibeSync home — Bridged for Spotify Web Player HTML Integration

async function render() {
  try { await doRender(); }
  catch (e) {
    console.error('[home] fatal error during render:', e);
  }
}

async function doRender() {
  const user = JSON.parse(localStorage.getItem('vs_user') || '{}');

  // 1. DYNAMIC GREETING
  // Find headers and update them based on the time of day
  const hour = new Date().getHours();
  const greetingText = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.querySelectorAll('h1, h2').forEach(h => {
    if (h.textContent.includes('Good')) h.textContent = greetingText;
  });

  // 2. USER AVATAR & LOGOUT
  // Target Spotify's native profile widget
  const avatarBtn = document.querySelector('[data-testid="user-widget-link"]') || document.querySelector('button[aria-label*="Profile"]');
  if (avatarBtn) {
    const span = avatarBtn.querySelector('span');
    if (span) span.textContent = (user.name || 'U')[0].toUpperCase();

    // Use double-click for logout to preserve Spotify's native dropdown if CSS allows it
    avatarBtn.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (confirm('Log out of VibeSync + reset preferences?')) {
        ['vs_user', 'vs_prefs', 'vs_prefs_full'].forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        location.href = 'welcome.html';
      }
    });
  }

  // 3. NATIVE SEARCH BAR INTEGRATION
  const searchInput = document.querySelector('input[type="search"], input[placeholder*="play"]');
  if (searchInput) {
    searchInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        e.preventDefault();
        const query = e.target.value.trim();
        
        if (window.searchAndPlay) {
          window.searchAndPlay(query);
        } else {
          try {
            const data = await window.cat.search(query, 12);
            if (data && data.results?.length && window.vsSetQueue) {
              window.vsSetQueue(data.results, 0);
            }
          } catch (err) { console.error('Search failed', err); }
        }
      }
    });
  }

  // 4. SPOTIFY PLAY BUTTONS INTERCEPTION
  document.body.addEventListener('click', async (e) => {
    const playBtn = e.target.closest('[data-testid="play-button"]');
    
    // If a play button was clicked on any Spotify card
    if (playBtn) {
      e.preventDefault();
      e.stopPropagation();
      
      let query = '';
      
      // Spotify brilliantly injects "Play [Song] by [Artist]" into the aria-label. 
      // We extract this to use as the perfect search string for JioSaavn!
      const ariaLabel = playBtn.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.startsWith('Play ')) {
        query = ariaLabel.replace('Play ', '').trim();
      } else {
        // Fallback: Manually extract text from the closest card
        const card = playBtn.closest('[data-encore-id="card"], [data-testid="tracklist-row"]');
        if (card) {
          const titleEl = card.querySelector('[data-encore-id="cardTitle"], [data-encore-id="listRowTitle"]');
          if (titleEl) query = titleEl.textContent.trim();
        }
      }

      // If we extracted a song/playlist name, send it to the VibeSync catalog
      if (query) {
        try {
          // Play button animations (visual feedback)
          playBtn.style.transform = 'scale(0.9)';
          setTimeout(() => playBtn.style.transform = 'scale(1)', 150);

          const data = await window.cat.search(query, 10);
          const results = data.results || [];
          
          if (results.length > 0) {
            // Push results to the VibeSync player queue
            if (window.vsSetQueue) {
              window.vsSetQueue(results, 0);
            } else if (window.vsAudio) {
              window.vsAudio.src = results[0].url;
              window.vsAudio.play();
              if (window.updateNowPlaying) window.updateNowPlaying(results[0]);
            }
          } else {
            console.warn('Track not found on JioSaavn for query:', query);
          }
        } catch (err) {
          console.error('Playback error', err);
        }
      }
      return;
    }

    // Generic Card clicks (if they miss the play button but click the cover art)
    const card = e.target.closest('[data-encore-id="card"]');
    if (card && !e.target.closest('a')) {
       e.preventDefault();
       const titleEl = card.querySelector('[data-encore-id="cardTitle"]');
       if (titleEl && window.searchAndPlay) {
          window.searchAndPlay(titleEl.textContent.trim());
       }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
