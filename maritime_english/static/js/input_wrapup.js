// input_wrapup.js
// Wrap-up: data-driven behavior (uses window.SECTION_CONTENT), play/pause audio, language toggle,
// notebook check animation, and small UX touches.

document.addEventListener('DOMContentLoaded', function() {
  const SECTION = window.SECTION_CONTENT || {};
  const UNIT = window.UNIT_CONTENT || {};
  const UNIT_ID = window.UNIT_ID || 1;

  const audioBtn = document.getElementById('audio-btn');
  const wrapupAudio = document.getElementById('wrapup-audio');
  const langToggle = document.getElementById('lang-toggle-btn');
  const wrapupParagraph = document.getElementById('wrapup-paragraph');
  const notebook = document.getElementById('notebook');
  const checkmark = document.getElementById('checkmark');
  const goBtn = document.getElementById('go-noticing');

  // texts coming from SECTION (fallback to defaults)
  const texts = {
    en: SECTION.message_en || SECTION.message || "Great work! Now you know the full alphabet and numbers, and how they are used for ship names, call signs, MMSI, and radio channels. You’ll see numbers again in later units, like time, weather, and sea reports.",
    id: SECTION.message_id || "Kerja bagus! Sekarang kalian sudah mengetahui alfabet dan angka lengkap, serta bagaimana cara menggunakannya untuk nama kapal, tanda panggilan, MMSI, dan saluran radio. Kalian akan menemui angka lagi di unit-unit selanjutnya, seperti waktu, cuaca, dan laporan pelayaran."
  };

  let currentLang = 'en';
  let isPlaying = false;

  // init: hide notebook animation
  if (notebook) notebook.classList.remove('show');

  // Ensure play button appears ready
  if (goBtn) {
    goBtn.style.opacity = goBtn.style.opacity || '1';
  }

  // Audio play/pause safe handler
  if (audioBtn && wrapupAudio) {
    audioBtn.addEventListener('click', async () => {
      try {
        wrapupAudio.muted = false;
        if (wrapupAudio.paused) {
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
        console.error('Play failed:', err);
        // gentle UI-friendly message (no blocking alert)
        showInlineNotice('Audio could not be played. Check your sound or reload the page.');
      }
    });

    wrapupAudio.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      // show notebook check animation
      if (notebook) {
        notebook.classList.add('show');
        if (checkmark) {
          checkmark.classList.remove('pulse');
          void checkmark.offsetWidth; // reflow
          checkmark.classList.add('pulse');
        }
      }
    });
  }

  // Language toggle: swap paragraph text only (audio stays EN by spec)
  if (langToggle && wrapupParagraph) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      wrapupParagraph.textContent = texts[currentLang] || texts.en;
    });
  }

  // keyboard Enter/Space support for audio button
  if (audioBtn) {
    audioBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); audioBtn.click(); }
    });
  }

  // small helper to show inline non-blocking message (temporary)
  function showInlineNotice(msg) {
    let el = document.getElementById('wrapup-inline-notice');
    if (!el) {
      el = document.createElement('div');
      el.id = 'wrapup-inline-notice';
      el.setAttribute('role','status');
      el.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#111827; color:white; padding:8px 14px; border-radius:8px; z-index:9999; box-shadow:0 6px 18px rgba(0,0,0,0.2);';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._hideTO);
    el._hideTO = setTimeout(()=>{ el.style.opacity='0'; }, 3200);
  }

  // cleanup
  window.addEventListener('beforeunload', () => {
    try { if (wrapupAudio) { wrapupAudio.pause(); wrapupAudio.currentTime = 0; } } catch(e){}
  });
});
