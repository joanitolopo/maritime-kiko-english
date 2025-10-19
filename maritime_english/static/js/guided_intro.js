// static/js/guided_intro.js
document.addEventListener('DOMContentLoaded', () => {
  const audioBtn = document.getElementById('audio-btn');
  const guidedAudio = document.getElementById('guided-audio');
  const langToggle = document.getElementById('lang-toggle');
  const paragraph = document.getElementById('guided-paragraph');
  const radioConsole = document.getElementById('radio-console');
  const startBtn = document.getElementById('start-guided');

  const SECTION = window.SECTION_CONTENT || {};
  const texts = {
    en: SECTION.text_en || "Now, let’s try real communication. I’ll guide you through short radio tasks. Listen first, then repeat or respond as instructed.",
    id: SECTION.text_id || "Sekarang mari kita coba komunikasi nyata. Saya akan memandu kalian melalui tugas radio singkat. Dengarkan dulu, lalu ulangi atau jawab sesuai instruksi."
  };

  let currentLang = 'en';
  let isPlaying = false;

  // language toggle
  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'id' : 'en';
    langToggle.textContent = currentLang.toUpperCase();
    paragraph.textContent = texts[currentLang];
  });

  // audio control
  if (audioBtn && guidedAudio) {
    audioBtn.addEventListener('click', async () => {
      try {
        if (guidedAudio.paused) {
          await guidedAudio.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          radioConsole.classList.add('active');
          audioBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
          guidedAudio.pause();
          isPlaying = false;
          audioBtn.classList.remove('playing');
          radioConsole.classList.remove('active');
          audioBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
      } catch (err) {
        console.error('Audio play failed', err);
        alert('Audio gagal diputar. Periksa path file audio di server.');
      }
    });

    guidedAudio.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      radioConsole.classList.remove('active');
      audioBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
  }

  // button: navigate to next section
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const href = startBtn.dataset.next;
      if (href) {
        startBtn.style.transform = 'scale(1.1)';
        setTimeout(() => window.location.href = href, 300);
      } else {
        alert('Next section not configured.');
      }
    });
  }

  // keyboard support
  [audioBtn, startBtn].forEach(el => {
    if (!el) return;
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });
});
