// static/js/authentic_task_2.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const exampleAudio = document.getElementById('example-audio');
  const replayBtn = document.getElementById('replay-example');
  const practiceBtn = document.getElementById('practice-spell');
  const micRay = document.getElementById('mic-ray');
  const feedback = document.getElementById('feedback-bubble');
  const fbContent = document.getElementById('fb-content');
  const nextBtn = document.getElementById('next-sim2');
  const langToggle = document.getElementById('sim2-lang-toggle');
  const scenarioDesc = document.getElementById('scenario-desc');
  const dialogueScript = document.getElementById('dialogue-script');
  const instrEl = document.getElementById('task-instr');

  let currentLang = 'en';
  let hasHeardExample = false;
  let practiced = false;

  // init text/audio from SECTION
  if (SECTION.scenario_en && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_en;
  if (SECTION.dialogue_en && dialogueScript) dialogueScript.innerHTML = SECTION.dialogue_en;
  if (SECTION.instruction_en && instrEl) instrEl.textContent = SECTION.instruction_en;
  if (SECTION.audio_example && exampleAudio) exampleAudio.src = SECTION.audio_example;
  if (SECTION.default_feedback && fbContent) fbContent.textContent = SECTION.default_feedback;

  // replay example behavior
  if (replayBtn && exampleAudio) {
    replayBtn.addEventListener('click', async () => {
      try {
        exampleAudio.currentTime = 0;
        await exampleAudio.play();
        replayBtn.classList.add('playing');
        replayBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
        if (micRay) micRay.classList.add('on');
      } catch (err) {
        console.error('Play example failed', err);
        alert('Audio gagal diputar. Periksa file audio di server.');
      }
    });

    exampleAudio.addEventListener('ended', () => {
      replayBtn.classList.remove('playing');
      replayBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      if (micRay) micRay.classList.remove('on');
      hasHeardExample = true;
    });

    exampleAudio.addEventListener('pause', () => {
      replayBtn.classList.remove('playing');
      replayBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      if (micRay) micRay.classList.remove('on');
    });
  }

  // practice button (role-play)
  if (practiceBtn) {
    // give it initial pulse if provided in config
    practiceBtn.classList.add('pulse');

    practiceBtn.addEventListener('click', () => {
      practiceBtn.classList.add('doing');
      setTimeout(() => practiceBtn.classList.remove('doing'), 280);

      // heuristic: prefer positive feedback if user heard example; otherwise prompt to replay
      if (hasHeardExample || (exampleAudio && exampleAudio.currentTime > 0)) {
        const goodMsg = SECTION.feedback_good_en || SECTION.default_feedback || 'Perfect spelling! Loud and clear.';
        showFeedback(goodMsg);
        practiced = true;
        enableNext();
      } else {
        const tryMsg = SECTION.feedback_try_en || 'Some letters unclear. Try again.';
        showFeedback(tryMsg);
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

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (nextBtn.disabled) { alert('Please practice the spelling first.'); return; }
      const href = nextBtn.dataset.next;
      if (href) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(() => { window.location.href = href; }, 220);
      } else {
        console.warn('Next simulation route not configured.');
      }
    });
    nextBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
    });
  }

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (currentLang === 'id') {
        if (SECTION.scenario_id && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_id;
        if (SECTION.dialogue_id && dialogueScript) dialogueScript.innerHTML = SECTION.dialogue_id;
        if (SECTION.instruction_id && instrEl) instrEl.textContent = SECTION.instruction_id;
      } else {
        if (SECTION.scenario_en && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_en;
        if (SECTION.dialogue_en && dialogueScript) dialogueScript.innerHTML = SECTION.dialogue_en;
        if (SECTION.instruction_en && instrEl) instrEl.textContent = SECTION.instruction_en;
      }
    });
  }

  // small CSS injection for pop/animations
  const style = document.createElement('style');
  style.innerHTML = `
    .pop-visible { animation: popIn .32s ease; }
    @keyframes popIn { from { opacity:0; transform: translateY(6px) scale(.98);} to { opacity:1; transform:translateY(0) scale(1);} }
    .btn-practice.doing { transform: translateY(-2px); }
    .glow-redirect { box-shadow: 0 12px 34px rgba(37,99,235,0.14); transform: translateY(-4px); }
  `;
  document.head.appendChild(style);

  // cleanup
  window.addEventListener('beforeunload', () => {
    try { if (exampleAudio) { exampleAudio.pause(); exampleAudio.currentTime = 0; } } catch(e){}
  });
});
