// static/js/authentic_task_1.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const captainAudio = document.getElementById('captain-call-audio');
  const replayBtn = document.getElementById('replay-call');
  const micRay = document.getElementById('mic-ray');
  const practiceBtn = document.getElementById('practice-btn');
  const feedback = document.getElementById('feedback-bubble');
  const fbContent = document.getElementById('fb-content');
  const nextBtn = document.getElementById('next-sim-btn');
  const langToggle = document.getElementById('sim1-lang-toggle');
  const scenarioDesc = document.getElementById('scenario-desc');
  const dialogueScript = document.getElementById('dialogue-script');
  const instructionEl = document.getElementById('task-instr');

  let isPlaying = false;
  let practiced = false;
  let currentLang = 'en';

  // initialize text/audio from SECTION
  if (SECTION.scenario_en && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_en;
  if (SECTION.dialogue_en && dialogueScript) dialogueScript.innerHTML = SECTION.dialogue_en;
  if (SECTION.instruction_en && instructionEl) instructionEl.textContent = SECTION.instruction_en;
  if (SECTION.audio_call && captainAudio) captainAudio.src = SECTION.audio_call;
  if (fbContent && SECTION.default_feedback) fbContent.textContent = SECTION.default_feedback;

  // play/pause captain call
  if (replayBtn && captainAudio) {
    replayBtn.addEventListener('click', async () => {
      try {
        captainAudio.currentTime = 0;
        await captainAudio.play();
        isPlaying = true;
        replayBtn.classList.add('playing');
        replayBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
        if (micRay) micRay.classList.add('on');
      } catch (err) {
        console.error('Audio play failed', err);
        alert('Audio gagal diputar. Periksa file audio.');
      }
    });

    // toggle display when audio ends / paused
    captainAudio.addEventListener('ended', () => {
      isPlaying = false;
      replayBtn.classList.remove('playing');
      replayBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      if (micRay) micRay.classList.remove('on');
    });
    // if user pauses audio element (not exposed UI) reflect state
    captainAudio.addEventListener('pause', () => {
      isPlaying = false;
      replayBtn.classList.remove('playing');
      replayBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      if (micRay) micRay.classList.remove('on');
    });

    // keyboard support
    replayBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replayBtn.click(); }
    });
  }

  // practice button (role-play, no recording)
  if (practiceBtn) {
    practiceBtn.addEventListener('click', () => {
      // UX: brief animation
      practiceBtn.classList.add('doing');
      setTimeout(() => practiceBtn.classList.remove('doing'), 300);

      // Show feedback: use SECTION feedback if present
      const goodMsg = (SECTION.feedback_good_en) ? SECTION.feedback_good_en : (SECTION.default_feedback || 'Loud and clear! Well done.');
      const tryMsg = (SECTION.feedback_try_en) ? SECTION.feedback_try_en : 'Not clear enough. Try again with a stronger voice.';

      // Simple heuristic: if user recently heard the captain audio (within current page load)
      // then show positive feedback; otherwise suggest replay. We'll check captainAudio.currentTime > 0 or played flag.
      const heard = captainAudio && (captainAudio.currentTime > 0 || captainAudio.readyState > 0 || captainAudio.paused === false);
      if (heard) {
        showFeedback(goodMsg);
        enableNext();
        practiced = true;
      } else {
        showFeedback(tryMsg);
        // do not enable Next until user replays and practices again
      }
    });

    practiceBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); practiceBtn.click(); }
    });
  }

  function showFeedback(msg) {
    if (!feedback) return;
    fbContent.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    // auto-hide after 3s
    setTimeout(() => {
      feedback.classList.add('visually-hidden');
      feedback.classList.remove('pop-visible');
    }, 3200);
  }

  function enableNext() {
    if (!nextBtn) return;
    nextBtn.disabled = false;
    nextBtn.classList.add('enabled');
    nextBtn.setAttribute('aria-disabled', 'false');
  }

  // Next button
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (nextBtn.disabled) {
        alert('Please practice the response first.');
        return;
      }
      const href = nextBtn.dataset.next;
      if (href) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(() => { window.location.href = href; }, 240);
      } else {
        console.warn('Next simulation route not configured.');
      }
    });
    nextBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
    });
  }

  // language toggle (swap text only)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (currentLang === 'id') {
        if (SECTION.scenario_id && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_id;
        if (SECTION.dialogue_id && dialogueScript) dialogueScript.innerHTML = SECTION.dialogue_id;
        if (SECTION.instruction_id && instructionEl) instructionEl.textContent = SECTION.instruction_id;
      } else {
        if (SECTION.scenario_en && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_en;
        if (SECTION.dialogue_en && dialogueScript) dialogueScript.innerHTML = SECTION.dialogue_en;
        if (SECTION.instruction_en && instructionEl) instructionEl.textContent = SECTION.instruction_en;
      }
    });
  }

  // small CSS injection for pop-visible effect
  const style = document.createElement('style');
  style.innerHTML = `
    .pop-visible { animation: popIn .32s ease; }
    @keyframes popIn { from { opacity:0; transform: translateY(6px) scale(.98);} to { opacity:1; transform:translateY(0) scale(1);} }
    .audio-play-btn.doing { transform: translateY(-2px); }
    .btn-practice.doing { transform: translateY(-2px); }
    .glow-redirect { box-shadow: 0 12px 34px rgba(37,99,235,0.14); transform: translateY(-4px); }
  `;
  document.head.appendChild(style);

  // cleanup
  window.addEventListener('beforeunload', () => {
    try { if (captainAudio) { captainAudio.pause(); captainAudio.currentTime = 0; } } catch(e){}
  });
});
