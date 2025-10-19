// static/js/authentic_task_3.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const exampleAudio = document.getElementById('example-audio');
  const replayBtn = document.getElementById('replay-example');
  const practiceBtn = document.getElementById('practice-btn');
  const micRay = document.getElementById('mic-ray');
  const feedback = document.getElementById('feedback-bubble');
  const fbContent = document.getElementById('fb-content');
  const nextBtn = document.getElementById('next-sim3');
  const langToggle = document.getElementById('sim3-lang-toggle');
  const scenarioDesc = document.getElementById('scenario-desc');
  const digitalMMSI = document.getElementById('digital-mmsi');
  const digitalChannel = document.getElementById('digital-channel');
  const instrEl = document.getElementById('task-instr');

  let currentLang = 'en';
  let heardExample = false;
  let practiced = false;

  // initialize from SECTION
  if (SECTION.scenario_en && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_en;
  if (SECTION.example_mmsi && digitalMMSI) digitalMMSI.textContent = SECTION.example_mmsi;
  if (SECTION.example_channel && digitalChannel) digitalChannel.textContent = SECTION.example_channel;
  if (SECTION.dialogue_en) {
    const dlg = document.getElementById('dialogue-script');
    if (dlg) dlg.innerHTML = SECTION.dialogue_en;
  }
  if (SECTION.instruction_en && instrEl) instrEl.textContent = SECTION.instruction_en;
  if (SECTION.audio_example && exampleAudio) exampleAudio.src = SECTION.audio_example;
  if (SECTION.default_feedback && fbContent) fbContent.textContent = SECTION.default_feedback;

  // replay example: play and toggle mic + panel glow
  function setPanelGlow(on) {
    const panel = document.querySelector('.digital-panel');
    if (!panel) return;
    if (on) panel.classList.add('active-glow');
    else panel.classList.remove('active-glow');
  }

  if (replayBtn && exampleAudio) {
    replayBtn.addEventListener('click', async () => {
      try {
        exampleAudio.currentTime = 0;
        await exampleAudio.play();
        replayBtn.classList.add('playing');
        replayBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (micRay) micRay.classList.add('on');
        setPanelGlow(true);
      } catch (err) {
        console.error('Example play failed', err);
        alert('Audio gagal diputar. Periksa file audio.');
      }
    });

    exampleAudio.addEventListener('ended', () => {
      replayBtn.classList.remove('playing');
      replayBtn.innerHTML = '<i class="fas fa-play"></i>';
      if (micRay) micRay.classList.remove('on');
      setPanelGlow(false);
      heardExample = true;
    });
    exampleAudio.addEventListener('pause', () => {
      replayBtn.classList.remove('playing');
      replayBtn.innerHTML = '<i class="fas fa-play"></i>';
      if (micRay) micRay.classList.remove('on');
      setPanelGlow(false);
    });
  }

  // practice button: role-play action (no recording). If user heard example -> positive feedback + enable next
  if (practiceBtn) {
    practiceBtn.classList.add('pulse');
    practiceBtn.addEventListener('click', () => {
      // small visual press
      practiceBtn.classList.add('doing');
      setTimeout(() => practiceBtn.classList.remove('doing'), 260);

      if (heardExample || (exampleAudio && exampleAudio.currentTime > 0)) {
        const msg = SECTION.feedback_good_en || SECTION.default_feedback || 'Excellent! Clear MMSI and channel.';
        showFeedback(msg);
        practiced = true;
        enableNext();
      } else {
        const msg = SECTION.feedback_try_en || 'Not clear enough. Try again.';
        showFeedback(msg);
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
      if (nextBtn.disabled) { alert('Please practice the response first.'); return; }
      const href = nextBtn.dataset.next;
      if (href) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(() => { window.location.href = href; }, 220);
      } else {
        console.warn('Next simulation not configured for this unit.');
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
      // swap texts
      if (currentLang === 'id') {
        if (SECTION.scenario_id && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_id;
        if (SECTION.dialogue_id) {
          const dlg = document.getElementById('dialogue-script');
          if (dlg) dlg.innerHTML = SECTION.dialogue_id;
        }
        if (SECTION.instruction_id && instrEl) instrEl.textContent = SECTION.instruction_id;
      } else {
        if (SECTION.scenario_en && scenarioDesc) scenarioDesc.innerHTML = SECTION.scenario_en;
        if (SECTION.dialogue_en) {
          const dlg = document.getElementById('dialogue-script');
          if (dlg) dlg.innerHTML = SECTION.dialogue_en;
        }
        if (SECTION.instruction_en && instrEl) instrEl.textContent = SECTION.instruction_en;
      }
    });
  }

  // visual glow for digital panel while audio plays (small CSS inserted)
  const style = document.createElement('style');
  style.innerHTML = `
    .digital-panel.active-glow { box-shadow: 0 8px 36px rgba(16,185,129,0.16), inset 0 0 10px rgba(16,185,129,0.06); transform: translateY(-2px); }
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
