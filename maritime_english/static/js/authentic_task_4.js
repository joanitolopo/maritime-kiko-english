// static/js/authentic_task_4.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const exampleAudio = document.getElementById('example-audio');
  const replayBtn = document.getElementById('replay-example');
  const practiceBtn = document.getElementById('practice-btn');
  const micRay = document.getElementById('mic-ray');
  const feedback = document.getElementById('feedback-bubble');
  const fbContent = document.getElementById('fb-content');
  const finishBtn = document.getElementById('finish-sim4');
  const langToggle = document.getElementById('sim4-lang-toggle');
  const scenarioDesc = document.getElementById('scenario-desc');
  const instrEl = document.getElementById('task-instr');
  const alertLights = document.getElementById('alert-lights');

  let currentLang = 'en';
  let heardExample = false;
  let practiced = false;

  // initialize from SECTION
  if (SECTION.scenario_en && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_en;
  if (SECTION.dialogue_en) {
    const dlg = document.getElementById('dialogue-script');
    if (dlg) dlg.innerHTML = SECTION.dialogue_en;
  }
  if (SECTION.instruction_en && instrEl) instrEl.textContent = SECTION.instruction_en;
  if (SECTION.audio_example && exampleAudio) exampleAudio.src = SECTION.audio_example;
  if (SECTION.default_feedback && fbContent) fbContent.textContent = SECTION.default_feedback;

  // helper show feedback
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

  // strobe control
  function setAlert(on) {
    if (!alertLights) return;
    if (on) alertLights.classList.add('strobe');
    else alertLights.classList.remove('strobe');
  }

  // replay example: play + red strobe + mic on
  if (replayBtn && exampleAudio) {
    replayBtn.addEventListener('click', async () => {
      try {
        exampleAudio.currentTime = 0;
        await exampleAudio.play();
        replayBtn.classList.add('playing');
        replayBtn.innerHTML = '<i class="fas fa-pause"></i>';
        setAlert(true);
        if (micRay) micRay.classList.add('on');
      } catch (err) {
        console.error('Example play failed', err);
        alert('Audio gagal diputar. Periksa file audio.');
      }
    });

    exampleAudio.addEventListener('ended', () => {
      replayBtn.classList.remove('playing');
      replayBtn.innerHTML = '<i class="fas fa-play"></i>';
      setAlert(false);
      if (micRay) micRay.classList.remove('on');
      heardExample = true;
    });
    exampleAudio.addEventListener('pause', () => {
      replayBtn.classList.remove('playing');
      replayBtn.innerHTML = '<i class="fas fa-play"></i>';
      setAlert(false);
      if (micRay) micRay.classList.remove('on');
    });
  }

  // practice button: role-play (no real recording). Vibrate animation + feedback.
  if (practiceBtn) {
    practiceBtn.addEventListener('click', () => {
      // brief vibrate animation
      practiceBtn.classList.add('vibrate');
      setTimeout(() => practiceBtn.classList.remove('vibrate'), 280);

      // if user heard example, positive feedback & enable finish; else prompt to hear example
      if (heardExample || (exampleAudio && exampleAudio.currentTime > 0)) {
        const msg = SECTION.feedback_good_en || SECTION.default_feedback || 'Clear distress message. Well done, cadet.';
        showFeedback(msg);
        practiced = true;
        enableFinish();
      } else {
        const msg = SECTION.feedback_try_en || 'Important info missing. Repeat with ship name, MMSI, and emergency type.';
        showFeedback(msg);
      }
    });

    practiceBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); practiceBtn.click(); }
    });
  }

  function enableFinish() {
    if (!finishBtn) return;
    finishBtn.disabled = false;
    finishBtn.classList.add('enabled');
    finishBtn.setAttribute('aria-disabled', 'false');
  }

  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      if (finishBtn.disabled) { alert('Please practice the distress call first.'); return; }
      const href = finishBtn.dataset.next;
      if (href) {
        finishBtn.classList.add('glow-redirect');
        setTimeout(() => { window.location.href = href; }, 220);
      } else {
        console.warn('Finish Simulation next not configured.');
      }
    });
    finishBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finishBtn.click(); }
    });
  }

  // language toggle swaps text (audio remains EN)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (currentLang === 'id') {
        if (SECTION.scenario_id && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_id;
        if (SECTION.dialogue_id) {
          const dlg = document.getElementById('dialogue-script');
          if (dlg) dlg.innerHTML = SECTION.dialogue_id;
        }
        if (SECTION.instruction_id && instrEl) instrEl.textContent = SECTION.instruction_id;
        if (SECTION.feedback_good_id && fbContent) fbContent.textContent = SECTION.feedback_good_id;
      } else {
        if (SECTION.scenario_en && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_en;
        if (SECTION.dialogue_en) {
          const dlg = document.getElementById('dialogue-script');
          if (dlg) dlg.innerHTML = SECTION.dialogue_en;
        }
        if (SECTION.instruction_en && instrEl) instrEl.textContent = SECTION.instruction_en;
        if (SECTION.feedback_good_en && fbContent) fbContent.textContent = SECTION.feedback_good_en;
      }
    });
  }

  // small dynamic CSS for pop-in
  const style = document.createElement('style');
  style.innerHTML = `
    .pop-visible { animation: popIn .28s ease; }
    @keyframes popIn { from { opacity:0; transform: translateY(6px) scale(.98);} to { opacity:1; transform:translateY(0); } }
    .glow-redirect { box-shadow: 0 12px 34px rgba(185,28,28,0.14); transform: translateY(-4px); }
  `;
  document.head.appendChild(style);

  // cleanup
  window.addEventListener('beforeunload', () => {
    try { if (exampleAudio) { exampleAudio.pause(); exampleAudio.currentTime = 0; } } catch(e){}
  });
});
