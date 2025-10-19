// static/js/noticing_intro.js  (data-driven)
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const langToggle = document.getElementById('notice-lang-toggle');
  const noticeText = document.getElementById('notice-text');
  const audioBtn = document.getElementById('notice-audio-btn');
  const startBtn = document.getElementById('start-noticing-btn');
  const noticeAudio = document.getElementById('notice-audio');

  // texts from SECTION (fallbacks)
  const texts = {
    en: SECTION.intro_en || "Now let’s look more closely at the alphabet and numbers. Some of them sound different in Maritime English. Listen and compare.",
    id: SECTION.intro_id || "Sekarang mari kita lihat lebih dekat alfabet dan angka. Beberapa bunyinya berbeda dalam Bahasa Inggris Maritim. Dengarkan dan bandingkan."
  };

  // If audio src wasn't set in template, allow SECTION to supply it here
  if (noticeAudio && (!noticeAudio.src || noticeAudio.src === window.location.href)) {
    if (SECTION.audio_en) noticeAudio.src = SECTION.audio_en;
  }

  let currentLang = 'en';
  let playedOnce = false;
  let isPlaying = false;

  // visual hint: keep start glowing until audio played once
  if (startBtn) startBtn.classList.add('btn-start-glow');

  // initialize text
  if (noticeText) noticeText.textContent = texts.en;
  if (langToggle) langToggle.textContent = 'EN';

  // Toggle texts only (audio remains EN default per spec)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (noticeText) {
        // animate update
        noticeText.classList.remove('fade-text');
        void noticeText.offsetWidth;
        noticeText.textContent = texts[currentLang];
        noticeText.classList.add('fade-text');
      }
    });
  }

  // Play / Pause audio
  if (audioBtn) {
    audioBtn.addEventListener('click', async () => {
      if (!noticeAudio || !noticeAudio.src) {
        console.warn('No audio source for noticing intro (SECTION.audio_en).');
        alert('Audio tidak tersedia. Periksa file audio di server.');
        return;
      }
      if (isPlaying) {
        noticeAudio.pause();
        isPlaying = false;
        audioBtn.classList.remove('playing');
        audioBtn.innerHTML = '<i class="fas fa-play"></i>';
      } else {
        try {
          await noticeAudio.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } catch (err) {
          console.warn('Audio play failed', err);
          alert('Audio gagal diputar. Cek console (F12) dan Network tab untuk detail.');
        }
      }
    });
  }

  // on ended / play events -> unlock Start
  if (noticeAudio) {
    noticeAudio.addEventListener('ended', () => {
      isPlaying = false;
      if (audioBtn) {
        audioBtn.classList.remove('playing');
        audioBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
      playedOnce = true;
      unlockStart();
    });

    noticeAudio.addEventListener('play', () => {
      playedOnce = true;
      unlockStart();
    });

    noticeAudio.addEventListener('error', (ev) => {
      console.error('Notice audio error', ev);
      // provide gentle UI hint
      if (audioBtn) audioBtn.classList.remove('playing');
      showInlineNotice('Audio file tidak tersedia. Cek folder static/data/audio.');
    });
  }

  function unlockStart() {
    if (!startBtn) return;
    if (playedOnce) {
      startBtn.disabled = false;
      startBtn.setAttribute('aria-disabled', 'false');
      startBtn.classList.remove('btn-start-glow');
    }
  }

  // Start button click -> navigate via data-next
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (!playedOnce) {
        alert(SECTION.listen_first_message || 'Please listen to the intro at least once before starting.');
        return;
      }
      const nextUrl = startBtn.dataset.next;
      if (nextUrl) {
        window.location.href = nextUrl;
      } else {
        console.warn('No next URL provided on Start button (data-next).');
      }
    });
  }

  // keyboard: support Enter/Space on buttons
  [audioBtn, startBtn, langToggle].forEach(el => {
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });

  // helper: small non-blocking notice
  function showInlineNotice(msg) {
    let el = document.getElementById('notice-inline-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'notice-inline-msg';
      el.setAttribute('role','status');
      el.style.cssText = 'position:fixed; bottom:22px; left:50%; transform:translateX(-50%); background:#111827; color:#fff; padding:8px 12px; border-radius:8px; z-index:9999;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._hideTO);
    el._hideTO = setTimeout(()=> { el.style.opacity = '0'; }, 3200);
  }

  // small helper CSS injection for fade-text/start glow if not present
  (function injectHelpers() {
    const s = document.createElement('style');
    s.innerHTML = `
      .fade-text { animation: fadeInText 0.38s ease; }
      @keyframes fadeInText { from { opacity:0; transform:translateY(6px);} to { opacity:1; transform:translateY(0);} }
      .btn-start-glow { box-shadow: 0 8px 28px rgba(37,99,235,0.22); animation: pulseStart 1.6s infinite; }
      @keyframes pulseStart { 0% { box-shadow:0 0 0 0 rgba(37,99,235,0.16);} 70% { box-shadow:0 0 0 12px rgba(37,99,235,0);} 100% { box-shadow:0 0 0 0 rgba(37,99,235,0);} }
      .audio-play-btn.playing { transform: scale(0.98); }
    `;
    document.head.appendChild(s);
  })();

});
