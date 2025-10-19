// static/js/assessment_intro.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const introAudio = document.getElementById('intro-audio');
  const audioBtn = document.getElementById('intro-audio-btn');
  const langToggle = document.getElementById('assess-lang-toggle');
  const introText = document.getElementById('intro-text');
  const startBtn = document.getElementById('start-quiz-btn');
  const progressEl = document.getElementById('quiz-progress');

  let currentLang = 'en';
  let isPlaying = false;

  // initialize content
  if (SECTION.text_en && introText) introText.innerHTML = SECTION.text_en;
  if (introAudio && SECTION.audio_en) introAudio.src = SECTION.audio_en;

  // progress
  const total = SECTION.total_questions || 10;
  if (progressEl) progressEl.textContent = `0/${total} Questions`;

  // audio play/pause
  if (audioBtn && introAudio) {
    audioBtn.addEventListener('click', async () => {
      try {
        if (introAudio.paused) {
          introAudio.currentTime = 0;
          await introAudio.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
        } else {
          introAudio.pause();
          isPlaying = false;
          audioBtn.classList.remove('playing');
          audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
        }
      } catch (err) {
        console.error('Intro audio play failed', err);
        alert('Audio gagal diputar. Periksa file audio atau pengaturan audio.');
      }
    });

    introAudio.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
    });
  }

  // language toggle (text only)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');

      if (currentLang === 'id') {
        if (SECTION.text_id) introText.innerHTML = SECTION.text_id;
        // instruction could be swapped if present
      } else {
        if (SECTION.text_en) introText.innerHTML = SECTION.text_en;
      }
    });
  }

  // Start Quiz navigation (uses data-next)
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const next = startBtn.dataset.next;
      if (!next) {
        alert('Start target belum dikonfigurasi. Hubungi developer.');
        return;
      }
      // small bounce effect
      startBtn.classList.add('btn-bounce');
      setTimeout(() => { startBtn.classList.remove('btn-bounce'); window.location.href = next; }, 220);
    });

    startBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startBtn.click(); }
    });
  }

  // small styles injection
  const style = document.createElement('style');
  style.innerHTML = `
    .btn-bounce { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(16,185,129,0.14); }
  `;
  document.head.appendChild(style);

  // cleanup
  window.addEventListener('beforeunload', () => {
    try { if (introAudio) { introAudio.pause(); introAudio.currentTime = 0; } } catch(e){}
  });
});
