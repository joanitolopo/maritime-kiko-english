// static/js/noticing_wrapup.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const langToggle = document.getElementById('wrap-lang-toggle');
  const wrapParagraph = document.getElementById('wrapup-paragraph');
  const audioBtn = document.getElementById('wrap-audio-btn');
  const wrapAudio = document.getElementById('wrapup-audio');
  const goBtn = document.getElementById('go-controlled');
  const captain = document.getElementById('captain-ray');
  const callouts = document.querySelectorAll('.callout');

  // texts from SECTION (EN default audio)
  const texts = {
    en: SECTION.text_en || "Great! You have noticed the differences in how we say letters and numbers at sea. These small changes make communication clear and safe.",
    id: SECTION.text_id || "Bagus sekali! Kalian sudah memperhatikan perbedaan cara kita menyebut huruf dan angka di laut. Perubahan kecil ini membuat komunikasi lebih jelas dan aman."
  };

  let currentLang = 'en';
  let isPlaying = false;

  // init UI
  if (langToggle) langToggle.textContent = 'EN';
  if (wrapParagraph) wrapParagraph.textContent = texts.en;

  // animate callouts & reveal CTA
  function revealPageVisuals() {
    // reveal callouts staggered
    callouts.forEach((c, i) => {
      setTimeout(() => c.classList.add('show'), 120 * i);
    });
    // show CTA glow
    if (goBtn) {
      setTimeout(() => goBtn.classList.add('glow'), 380);
      // remove glow after a while (keeps subtle)
      setTimeout(() => goBtn.classList.remove('glow'), 2400);
    }
  }
  // run on load
  revealPageVisuals();

  // language toggle swap text only (audio remains EN)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (wrapParagraph) wrapParagraph.textContent = texts[currentLang];
    });
  }

  // audio play/pause
  if (audioBtn && wrapAudio) {
    audioBtn.addEventListener('click', async () => {
      try {
        if (wrapAudio.paused) {
          await wrapAudio.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
          // small mic/thumbs animation
          if (captain) captain.classList.remove('thumbs');
        } else {
          wrapAudio.pause();
          isPlaying = false;
          audioBtn.classList.remove('playing');
          audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
        }
      } catch (err) {
        console.error('Wrap audio play failed', err);
        alert('Audio gagal diputar. Periksa file audio pada server.');
      }
    });

    // when audio ends: thumbs up + reveal subtle animation
    wrapAudio.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      // captain thumbs up
      if (captain) {
        captain.classList.add('thumbs');
        setTimeout(() => captain.classList.remove('thumbs'), 1400);
      }
      // ensure CTA highlighted
      if (goBtn) {
        goBtn.classList.add('glow');
        setTimeout(() => goBtn.classList.remove('glow'), 1400);
      }
    });
  }

  // keyboard access
  if (audioBtn) audioBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); audioBtn.click(); } });

  // go button: uses data-next for navigation
  if (goBtn) {
    goBtn.addEventListener('click', () => {
      const nextUrl = goBtn.dataset.next;
      if (nextUrl) {
        goBtn.classList.add('glow');
        setTimeout(() => { window.location.href = nextUrl; }, 260);
      } else {
        console.warn('No data-next on Go button for controlled practice.');
        alert('Target Controlled Practice belum dikonfigurasi untuk unit ini.');
      }
    });
    goBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBtn.click(); } });
  }

  // cleanup audio on unload
  window.addEventListener('beforeunload', () => {
    try { if (wrapAudio) { wrapAudio.pause(); wrapAudio.currentTime = 0; } } catch(e){}
  });

});
