// static/js/authentic_intro.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const audioBtn = document.getElementById('auth-audio-btn');
  const audioEl = document.getElementById('auth-audio');
  const langToggle = document.getElementById('auth-lang-toggle');
  const introText = document.getElementById('intro-text');
  const instr = document.getElementById('auth-instruction');
  const startBtn = document.getElementById('start-sim-btn');
  const radioLights = document.querySelectorAll('.radio-indicators .light');

  let isPlaying = false;
  let currentLang = 'en';

  // initialize text content from SECTION
  if (introText && SECTION.text_en) introText.innerHTML = SECTION.text_en;
  if (instr && SECTION.instruction_en) instr.textContent = SECTION.instruction_en;
  if (audioEl && SECTION.audio_en) audioEl.src = SECTION.audio_en;

  // audio play/pause
  if (audioBtn && audioEl) {
    audioBtn.addEventListener('click', async () => {
      try {
        audioEl.muted = false;
        if (audioEl.paused) {
          await audioEl.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
          // highlight lights gently
          radioLights.forEach(l => l.style.filter = 'brightness(1.2)');
        } else {
          audioEl.pause();
          isPlaying = false;
          audioBtn.classList.remove('playing');
          audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
          radioLights.forEach(l => l.style.filter = '');
        }
      } catch (err) {
        console.error('Audio play failed', err);
        alert('Audio gagal diputar. Periksa file audio dan pengaturan suara.');
      }
    });

    audioEl.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      radioLights.forEach(l => l.style.filter = '');
    });
  }

  // language toggle (text only)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (introText) introText.innerHTML = (currentLang === 'en') ? (SECTION.text_en || introText.innerHTML) : (SECTION.text_id || introText.innerHTML);
      if (instr) instr.textContent = (currentLang === 'en') ? (SECTION.instruction_en || instr.textContent) : (SECTION.instruction_id || instr.textContent);
    });
  }

  // start simulation: uses data-next on button
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const href = startBtn.dataset.next;
      if (!href) { alert('Start Simulation route not configured.'); return; }
      // pulse then redirect
      startBtn.classList.add('pulse-glow');
      setTimeout(() => { window.location.href = href; }, 260);
    });
    startBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startBtn.click(); }
    });
    // gentle repeating pulse to attract attention
    setInterval(() => { startBtn.classList.add('pulse-glow'); setTimeout(()=>startBtn.classList.remove('pulse-glow'), 700); }, 2200);
  }

  // keyboard support for audio
  if (audioBtn) {
    audioBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); audioBtn.click(); }
    });
  }

  // small CSS injection for pulse
  const style = document.createElement('style');
  style.innerHTML = `
    .pulse-glow { box-shadow: 0 12px 34px rgba(249,115,22,0.16); transform: translateY(-3px); transition: all .18s; }
  `;
  document.head.appendChild(style);

  // cleanup
  window.addEventListener('beforeunload', () => {
    try { if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; } } catch(e){}
  });
});
