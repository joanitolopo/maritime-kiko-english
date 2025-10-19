// static/js/controlled_intro.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const langToggle = document.getElementById('ctrl-lang-toggle');
  const introParagraph = document.getElementById('intro-paragraph');
  const audioBtn = document.getElementById('ctrl-audio-btn');
  const audioEl = document.getElementById('ctrl-audio');
  const startBtn = document.getElementById('start-exercises-btn');
  const workbook = document.getElementById('workbook');
  const avatar = document.getElementById('avatar-lina');

  // texts from SECTION (fallback strings)
  const texts = {
    en: SECTION.instruction_en || "Now it's your turn! Let's practice the alphabet and numbers step by step. Listen carefully and choose the correct answer.",
    id: SECTION.instruction_id || "Sekarang giliran kalian! Mari kita berlatih alfabet dan angka langkah demi langkah. Dengarkan dengan saksama dan pilih jawaban yang benar."
  };

  let currentLang = 'en';
  let hasListenedOnce = false;
  let isPlaying = false;

  // init UI
  if (introParagraph) introParagraph.textContent = texts.en;
  if (langToggle) langToggle.textContent = 'EN';

  // animate workbook open once when page loads
  setTimeout(() => {
    if (workbook) workbook.classList.add('open');
    // small avatar bounce
    if (avatar) avatar.style.transform = 'translateY(-6px)';
    setTimeout(()=> { if (avatar) avatar.style.transform = ''; }, 600);
    // animate start button in (if present)
    if (startBtn) { startBtn.classList.add('animate'); setTimeout(()=> startBtn.classList.remove('animate'), 900); }
  }, 260);

  // language toggle (text only)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (introParagraph) introParagraph.textContent = texts[currentLang];
    });
  }

  // audio play/pause handling (audio remains EN default)
  if (audioBtn && audioEl) {
    audioBtn.addEventListener('click', async () => {
      try {
        if (audioEl.paused) {
          await audioEl.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
        } else {
          audioEl.pause();
          isPlaying = false;
          audioBtn.classList.remove('playing');
          audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
        }
      } catch (err) {
        console.error('Audio play failed', err);
        alert('Audio gagal diputar. Periksa file audio di server atau izinkan pemutaran media.');
      }
    });

    audioEl.addEventListener('play', () => {
      hasListenedOnce = true;
      unlockStart();
    });

    audioEl.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      // small workbook/avatar feedback
      if (workbook) {
        workbook.classList.toggle('open');
        setTimeout(()=> workbook.classList.toggle('open'), 240);
      }
      unlockStart();
    });
  }

  function unlockStart() {
    if (!startBtn) return;
    if (hasListenedOnce) {
      startBtn.disabled = false;
      startBtn.setAttribute('aria-disabled', 'false');
      startBtn.classList.add('ready');
    }
  }

  // start button navigates — use data-next (server-provided)
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (startBtn.disabled) {
        alert('Please listen to the narration at least once before starting.');
        return;
      }
      const next = startBtn.dataset.next;
      if (next) {
        startBtn.classList.add('glow-redirect');
        setTimeout(() => { window.location.href = next; }, 200);
      } else {
        console.warn('No data-next configured on Start Exercises button.');
      }
    });
    startBtn.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === startBtn) { e.preventDefault(); startBtn.click(); }});
  }

  // keyboard for audio btn
  if (audioBtn) audioBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); audioBtn.click(); }});

  // cleanup audio on unload
  window.addEventListener('beforeunload', () => {
    try { if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; } } catch(e){}
  });
});
