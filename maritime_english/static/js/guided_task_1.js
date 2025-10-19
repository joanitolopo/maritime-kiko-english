// static/js/guided_task_1.js
document.addEventListener('DOMContentLoaded', () => {
  const btnReplayFull = document.getElementById('replay-full');
  const btnReplayLina = document.getElementById('replay-lina');
  const btnRepeat = document.getElementById('repeat-response');
  const audioFull = document.getElementById('audio-full');
  const audioLina = document.getElementById('audio-lina');
  const radioIndicator = document.getElementById('radio-indicator');
  const feedback = document.getElementById('task1-feedback');
  const fbContent = feedback ? feedback.querySelector('.fb-content') : null;
  const nextBtn = document.getElementById('next-task');
  const langToggle = document.getElementById('task1-lang-toggle');
  const instructionText = document.getElementById('task-instruction');
  const dialogueScript = document.getElementById('dialogue-script');

  const SECTION = window.SECTION_CONTENT || {};
  const texts = {
    en: {
      instruction: SECTION.instruction_en || "Listen to the exchange. Then, repeat OS Lina's response.",
      dialogue: SECTION.dialogue_en || 'Captain Ray: "This is MV ANTARA ... Radio check, over." <br> OS Lina: "Roger, MV ANTARA. Loud and clear."',
      feedback_good: SECTION.feedback_good || 'Loud and clear! Good job.',
      feedback_try: SECTION.feedback_try || 'Not clear enough. Listen again and repeat.'
    },
    id: {
      instruction: SECTION.instruction_id || "Dengarkan percakapan. Lalu, ulangi jawaban OS Lina.",
      dialogue: SECTION.dialogue_id || 'Captain Ray: "Ini MV ANTARA ... Periksa radio, over." <br> OS Lina: "Roger, MV ANTARA. Jelas."',
      feedback_good: SECTION.feedback_good_id || 'Kuat dan jelas! Bagus.',
      feedback_try: SECTION.feedback_try_id || 'Belum jelas. Dengarkan lagi dan ulangi.'
    }
  };

  let currentLang = 'en';
  let repeatedOnce = false;

  // helper to toggle radio indicator
  function startRadio() {
    if (radioIndicator) radioIndicator.classList.add('active');
  }
  function stopRadio() {
    if (radioIndicator) radioIndicator.classList.remove('active');
  }

  // play full dialogue
  if (btnReplayFull && audioFull) {
    btnReplayFull.addEventListener('click', async () => {
      try {
        stopRadio();
        audioFull.currentTime = 0;
        startRadio();
        await audioFull.play();
      } catch (err) {
        console.error('Play full failed', err);
        alert('Audio gagal diputar. Periksa asset di server.');
      }
    });

    audioFull.addEventListener('ended', () => {
      stopRadio();
    });

    btnReplayFull.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btnReplayFull.click(); }
    });
  }

  // play lina only
  if (btnReplayLina && audioLina) {
    btnReplayLina.addEventListener('click', async () => {
      try {
        audioLina.currentTime = 0;
        startRadio();
        await audioLina.play();
      } catch (err) {
        console.error('Play lina failed', err);
        alert('Audio gagal diputar. Periksa asset di server.');
      }
    });

    audioLina.addEventListener('ended', () => {
      stopRadio();
    });

    btnReplayLina.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btnReplayLina.click(); }
    });
  }

  // Repeat Response: prompt (no recording), show feedback and enable Next
  if (btnRepeat) {
    btnRepeat.addEventListener('click', () => {
      // simulate teacher feedback pop-in
      showFeedback(texts[currentLang].feedback_good);
      repeatedOnce = true;
      // show Next button
      if (nextBtn) {
        nextBtn.classList.remove('visually-hidden');
        nextBtn.classList.add('visually-visible');
        // slide-up animation (quick)
        nextBtn.style.transform = 'translateY(8px)';
        setTimeout(() => { nextBtn.style.transform = ''; }, 160);
      }
    });

    btnRepeat.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btnRepeat.click(); }
    });
  }

  function showFeedback(msg) {
    if (!feedback) return;
    const content = feedback.querySelector('.fb-content');
    if (content) content.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    // auto hide after 3s
    setTimeout(() => {
      feedback.classList.add('visually-hidden');
      feedback.classList.remove('pop-visible');
    }, 3000);
  }

  // Next navigation uses data-next
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!repeatedOnce) {
        alert('Please repeat the response first.');
        return;
      }
      const href = nextBtn.dataset.next;
      if (href) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(() => { window.location.href = href; }, 180);
      } else {
        alert('Next task not configured.');
      }
    });

    nextBtn.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') ) { e.preventDefault(); nextBtn.click(); }
    });
  }

  // language toggle: swap texts & dialogue
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      if (instructionText) instructionText.textContent = texts[currentLang].instruction;
      if (dialogueScript) dialogueScript.innerHTML = texts[currentLang].dialogue;
    });
  }

  // keyboard accessibility: allow space/enter on audio buttons is handled above

  // safety: if audio errors happen, hide radio indicator and show message
  [audioFull, audioLina].forEach(a => {
    if (!a) return;
    a.addEventListener('error', (ev) => {
      console.error('Audio element error', a.id, ev);
      stopRadio();
      showFeedback('Audio file not available. Please check assets.');
    });
  });
});
