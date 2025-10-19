// static/js/guided_wrapup.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const audioBtn = document.getElementById('gw-audio-btn');
  const gwAudio = document.getElementById('gw-audio');
  const langToggle = document.getElementById('gw-lang-toggle');
  const wrapupText = document.getElementById('wrapup-text');
  const goBtn = document.getElementById('gw-go-auth');
  const feedback = document.getElementById('gw-feedback');
  const fbContent = feedback ? feedback.querySelector('.fb-content') : null;
  const radioIndicator = document.querySelector('.radio-indicator');

  let isPlaying = false;
  let currentLang = 'en';

  // initialize text
  if (wrapupText && SECTION.text_en) wrapupText.innerHTML = SECTION.text_en;

  // audio play/pause
  if (audioBtn && gwAudio) {
    audioBtn.addEventListener('click', async () => {
      try {
        gwAudio.muted = false;
        if (gwAudio.paused) {
          await gwAudio.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
          // gentle pulse on radio indicator
          if (radioIndicator) radioIndicator.style.boxShadow = '0 0 18px rgba(52,211,153,0.9)';
        } else {
          gwAudio.pause();
          isPlaying = false;
          audioBtn.classList.remove('playing');
          audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
          if (radioIndicator) radioIndicator.style.boxShadow = '';
        }
      } catch (err) {
        console.error('Play failed', err);
        alert('Audio gagal diputar. Periksa pengaturan suara atau file audio.');
      }
    });

    gwAudio.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      if (radioIndicator) radioIndicator.style.boxShadow = '0 0 10px rgba(52,211,153,0.6)';
      // subtle thumbs-up feedback
      showFeedback(SECTION.feedback_good || 'Well done! Guided practice complete.');
    });
  }

  // language toggle — text only (audio stays EN)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');

      if (wrapupText) {
        wrapupText.innerHTML = (currentLang === 'en') ? (SECTION.text_en || wrapupText.innerHTML) : (SECTION.text_id || wrapupText.innerHTML);
      }
    });
  }

  // go to authentic task using data-next
  if (goBtn) {
    goBtn.addEventListener('click', () => {
      const href = goBtn.dataset.next;
      if (!href) {
        alert('Authentic Task route belum dikonfigurasi.');
        return;
      }
      // pulse + redirect
      goBtn.classList.add('pulse-glow');
      setTimeout(() => { window.location.href = href; }, 220);
    });
  }

  // small helper to show brief feedback bubble
  function showFeedback(msg) {
    if (!feedback || !fbContent) return;
    fbContent.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    setTimeout(() => {
      feedback.classList.add('visually-hidden');
      feedback.classList.remove('pop-visible');
    }, 3000);
  }

  // keyboard accessibility
  [audioBtn, goBtn].forEach(el => {
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });

  // inject minimal CSS for pulse
  const style = document.createElement('style');
  style.innerHTML = `
    .pulse-glow { box-shadow: 0 14px 40px rgba(16,185,129,0.18); transform: translateY(-4px); transition: all .18s; }
    .pop-visible { animation: popIn .34s ease; }
    @keyframes popIn { from { opacity:0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
  `;
  document.head.appendChild(style);

  // cleanup on page unload
  window.addEventListener('beforeunload', () => {
    try { if (gwAudio) { gwAudio.pause(); gwAudio.currentTime = 0; } } catch(e){}
  });
});
