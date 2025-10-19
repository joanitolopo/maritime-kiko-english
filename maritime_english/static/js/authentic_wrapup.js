// static/js/authentic_wrapup.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const wrapupAudio = document.getElementById('wrapup-audio');
  const audioBtn = document.getElementById('wrapup-audio-btn');
  const langToggle = document.getElementById('wrapup-lang-toggle');
  const wrapupText = document.getElementById('wrapup-text');
  const goBtn = document.getElementById('go-assessment');
  const deckLights = document.querySelector('.deck-lights');

  let currentLang = 'en';
  let isPlaying = false;

  // initialize text from SECTION
  if (SECTION.text_en && wrapupText) wrapupText.innerHTML = SECTION.text_en;
  if (wrapupAudio && SECTION.audio_en) wrapupAudio.src = SECTION.audio_en;

  // play / pause audio
  if (audioBtn && wrapupAudio) {
    audioBtn.addEventListener('click', async () => {
      try {
        if (wrapupAudio.paused) {
          wrapupAudio.currentTime = 0;
          await wrapupAudio.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
        } else {
          wrapupAudio.pause();
          isPlaying = false;
          audioBtn.classList.remove('playing');
          audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
        }
      } catch (err) {
        console.error('Wrapup audio play failed', err);
        alert('Audio gagal diputar. Periksa pengaturan audio / file.');
      }
    });

    wrapupAudio.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
    });
  }

  // language toggle: swap text (audio stays EN)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');

      if (currentLang === 'id') {
        if (SECTION.text_id) wrapupText.innerHTML = SECTION.text_id;
      } else {
        if (SECTION.text_en) wrapupText.innerHTML = SECTION.text_en;
      }
    });
  }

  // deck lights subtle animation
  if (deckLights) {
    setTimeout(() => deckLights.classList.add('sparkle'), 220);
  }

  // go to assessment navigation (uses data-next)
  if (goBtn) {
    goBtn.addEventListener('click', () => {
      const href = goBtn.dataset.next;
      if (!href) {
        alert('Assessment target belum diset. Hubungi developer.');
        return;
      }
      goBtn.classList.add('glow-redirect');
      setTimeout(() => { window.location.href = href; }, 260);
    });

    goBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBtn.click(); }
    });
  }

  // small dynamic styles
  const style = document.createElement('style');
  style.innerHTML = `
    .glow-redirect { box-shadow: 0 12px 30px rgba(16,185,129,0.14); transform: translateY(-3px); }
  `;
  document.head.appendChild(style);

  // cleanup
  window.addEventListener('beforeunload', () => {
    try { if (wrapupAudio) { wrapupAudio.pause(); wrapupAudio.currentTime = 0; } } catch(e){}
  });
});
