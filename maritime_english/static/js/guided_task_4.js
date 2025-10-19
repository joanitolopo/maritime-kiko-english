// static/js/guided_task_4.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};

  // elements
  const replayFullBtn = document.getElementById('replay-full');
  const replayKeyBtn = document.getElementById('replay-key');
  const fullAudio = document.getElementById('gt4-full-audio');
  const keyAudio = document.getElementById('gt4-key-audio');
  const sampleAudio = document.getElementById('gt4-sample-response');

  const repeatBtn = document.getElementById('repeat-response');
  const replaySampleBtn = document.getElementById('replay-sample');

  const feedback = document.getElementById('gt4-feedback');
  const fbContent = feedback ? feedback.querySelector('.fb-content') : null;

  const nextBtn = document.getElementById('gt4-next');
  const alertIndicator = document.getElementById('alert-indicator');
  const langToggle = document.getElementById('gt4-lang-toggle');
  const instructionEl = document.getElementById('gt4-instruction');
  const dialogueEl = document.getElementById('dialogue-text');

  let playedAny = false;
  let currentLang = 'en';
  let playingAudio = null;

  function showFeedback(msg, positive=true) {
    if (!feedback) return;
    fbContent.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    setTimeout(()=> {
      feedback.classList.add('visually-hidden');
      feedback.classList.remove('pop-visible');
    }, 2800);
  }

  // helper: toggle urgent button vibration (visual)
  function vibrateButton(btn) {
    if (!btn) return;
    btn.classList.add('vibrate');
    setTimeout(()=> btn.classList.remove('vibrate'), 420);
  }

  // helper to play audio, manage state & alert indicator
  async function playAudioClip(audioEl, activateIndicator=false) {
    if (!audioEl) return;
    try {
      if (playingAudio && playingAudio !== audioEl) {
        try { playingAudio.pause(); } catch(e){}
      }
      playingAudio = audioEl;
      if (activateIndicator && alertIndicator) alertIndicator.classList.add('blink');
      audioEl.currentTime = 0;
      await audioEl.play();
      playedAny = true;
      // enable next only after user repeats (logic below)
    } catch (err) {
      console.error('Audio play failed', err);
      showFeedback('Audio failed to play. Check your sound or reload.', false);
      if (alertIndicator) alertIndicator.classList.remove('blink');
    }
  }

  // wire replay full & key
  if (replayFullBtn && fullAudio) {
    replayFullBtn.addEventListener('click', async () => {
      vibrateButton(replayFullBtn);
      await playAudioClip(fullAudio, true);
    });
    fullAudio.addEventListener('ended', () => { if (alertIndicator) alertIndicator.classList.remove('blink'); showFeedback(SECTION.done_feedback || 'Listen closely.'); });
  }
  if (replayKeyBtn && keyAudio) {
    replayKeyBtn.addEventListener('click', async () => {
      vibrateButton(replayKeyBtn);
      await playAudioClip(keyAudio, true);
    });
    keyAudio.addEventListener('ended', () => { if (alertIndicator) alertIndicator.classList.remove('blink'); });
  }

  // replay sample response (pre-recorded sample)
  if (replaySampleBtn && sampleAudio) {
    replaySampleBtn.addEventListener('click', async () => {
      await playAudioClip(sampleAudio, false);
    });
  }

  // Repeat Response — student presses this after mimicking aloud
  if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
      // If user hasn't heard anything yet, remind them
      if (!playedAny) {
        showFeedback( (currentLang === 'en') ? 'Play the distress message first, then repeat the key info.' : 'Putar pesan terlebih dahulu, lalu ulangi informasi penting.' );
        return;
      }
      // Friendly optimistic feedback — we are not recording; assume success
      showFeedback(SECTION.feedback_good || (currentLang === 'en' ? 'Clear and precise. Well done, cadet!' : 'Jelas dan tepat. Kerja bagus!'));
      // enable Next
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.add('enabled');
        nextBtn.style.opacity = '1';
      }
    });
  }

  // Next navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (nextBtn.disabled) {
        alert(currentLang === 'en' ? 'Repeat the sample response to enable Next.' : 'Ulangi respons contoh untuk melanjutkan.');
        return;
      }
      const href = nextBtn.dataset.next;
      if (href) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(()=> window.location.href = href, 180);
      }
    });
  }

  // language toggle (text only)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      instructionEl.textContent = (currentLang === 'en') ? (SECTION.instruction_en || instructionEl.textContent) : (SECTION.instruction_id || instructionEl.textContent);
      dialogueEl.innerHTML = (currentLang === 'en') ? (SECTION.dialogue_en || dialogueEl.innerHTML) : (SECTION.dialogue_id || dialogueEl.innerHTML);
    });
  }

  // keyboard accessibility
  [replayFullBtn, replayKeyBtn, repeatBtn, replaySampleBtn, nextBtn].forEach(el => {
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });

  // small CSS helper for vibrate class injection
  const style = document.createElement('style');
  style.innerHTML = `
    .vibrate { animation: vibrate .36s linear; }
    @keyframes vibrate { 0% { transform: translateX(0);} 25% { transform: translateX(-3px);} 50% { transform: translateX(3px);} 75% { transform: translateX(-2px);} 100% { transform: translateX(0);} }
    .btn.audio-btn.vibrate { transform-origin:center; }
  `;
  document.head.appendChild(style);

  // cleanup
  window.addEventListener('beforeunload', () => {
    try { if (fullAudio) fullAudio.pause(); if (keyAudio) keyAudio.pause(); if (sampleAudio) sampleAudio.pause(); } catch(e){}
  });
});
