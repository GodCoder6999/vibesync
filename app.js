// UI-only handlers. Audio + search live in api.js.

// Like toggle
document.addEventListener('click', (e) => {
  const like = e.target.closest('.mp-like');
  if (!like) return;
  like.classList.toggle('liked');
  if (like.classList.contains('liked')) {
    like.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.578z"/></svg>';
  } else {
    like.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-.605-.463L1.348 8.309A4.582 4.582 0 0 1 1.689 2zm3.158.252A3.082 3.082 0 0 0 2.49 7.337l.005.005L7.8 13.664a.264.264 0 0 0 .311.069.262.262 0 0 0 .09-.069l5.312-6.33a3.043 3.043 0 0 0 .68-2.573 3.118 3.118 0 0 0-2.551-2.463 3.079 3.079 0 0 0-2.612.816l-.007.007a1.501 1.501 0 0 1-2.045 0l-.009-.008a3.082 3.082 0 0 0-2.121-.861z"/></svg>';
  }
});

// Mute toggle on mini-player volume button
document.addEventListener('click', (e) => {
  const mute = e.target.closest('#mpMute');
  if (!mute) return;
  const vol = document.querySelector('[data-volume] > div');
  if (window.vsAudio) {
    if (window.vsAudio.volume > 0) {
      window.vsAudio._lastVol = window.vsAudio.volume;
      window.vsAudio.volume = 0;
      if (vol) vol.style.width = '0%';
    } else {
      window.vsAudio.volume = window.vsAudio._lastVol || 0.8;
      if (vol) vol.style.width = (window.vsAudio.volume * 100) + '%';
    }
  }
});

// Library tabs
document.addEventListener('click', (e) => {
  const tab = e.target.closest('.lib-tab');
  if (!tab) return;
  tab.parentElement.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
});

// Mood chips
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
});
