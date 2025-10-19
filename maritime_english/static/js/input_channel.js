// input_channel.js (robust, data-driven)
document.addEventListener('DOMContentLoaded', function () {
  // Elements (may be absent in some templates)
  const audioBtn = document.getElementById('audio-btn');
  const replayBtn = document.getElementById('replay-btn');
  const channelAudio = document.getElementById('channel-audio');
  const screenText = document.getElementById('screen-text');
  const radioScreen = document.getElementById('radio-screen');
  const feedback = document.getElementById('feedback-bubble');
  const feedbackContent = feedback ? feedback.querySelector('.fb-content') : null;
  const langToggle = document.getElementById('lang-toggle-btn');
  const dialogueText = document.getElementById('dialogue-text');
  const instructionText = document.getElementById('instruction-text');
  const nextBtn = document.getElementById('next-btn');
  const continueLink = document.getElementById('continue-link');

  // data-driven: try to use SECTION_CONTENT if injected by template
  const SECTION = window.SECTION_CONTENT || {};
  const AUDIO_SRC = SECTION.audio_en || (channelAudio ? channelAudio.src : null);
  const NEXT_SECTION = SECTION.start_next_section || (continueLink ? continueLink.getAttribute('href') : null);

  // Optional quiz
  const enableQuiz = SECTION.enable_quiz === true || false;
  const quizArea = document.getElementById('quiz-area');
  const quizForm = document.getElementById('quiz-form');
  const quizFeedback = document.getElementById('quiz-feedback');

  // Texts (fall back to static copy)
  const texts = {
    en: {
      dialogue: SECTION.dialogue_en || "We also use numbers for radio channels. For example, the emergency channel is Channel 16, used for distress and safety. We say: WUN SIX.",
      instruction: SECTION.instruction_en || "Listen to the example. Then, repeat \"Channel WUN SIX\" aloud.",
      feedback_good: SECTION.feedback_en || "Great! Clear communication saves lives.",
      feedback_retry: SECTION.feedback_retry_en || "Not clear enough. Try again."
    },
    id: {
      dialogue: SECTION.dialogue_id || "Kita juga menggunakan angka untuk saluran radio. Misalnya, saluran darurat adalah Saluran 16, digunakan untuk keadaan bahaya dan keselamatan. Kita menyebutnya: WUN SIX.",
      instruction: SECTION.instruction_id || "Dengarkan contoh. Lalu, ulangi 'Channel WUN SIX' dengan suara keras.",
      feedback_good: SECTION.feedback_id || "Bagus! Komunikasi jelas menyelamatkan nyawa.",
      feedback_retry: SECTION.feedback_retry_id || "Belum jelas. Coba lagi."
    }
  };

  let currentLang = 'en';
  let isPlaying = false;

  // Safety: set audio src from data if provided
  if (channelAudio && AUDIO_SRC && channelAudio.src !== AUDIO_SRC) {
    channelAudio.src = AUDIO_SRC;
  }

  // UI helpers
  function showFeedback(msg) {
    if (!feedback || !feedbackContent) return;
    feedbackContent.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    setTimeout(() => {
      feedback.classList.add('visually-hidden');
      feedback.classList.remove('pop-visible');
    }, 3000);
  }

  function startBlink() {
    if (!radioScreen) return;
    radioScreen.classList.add('active');
  }
  function stopBlink() {
    if (!radioScreen) return;
    radioScreen.classList.remove('active');
  }

  // Language toggle (text-only)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (dialogueText) dialogueText.textContent = texts[currentLang].dialogue;
      if (instructionText) instructionText.textContent = texts[currentLang].instruction;
    });
  }

  // Ensure audioBtn & channelAudio exist before attaching listeners
  if (audioBtn && channelAudio) {
    audioBtn.addEventListener('click', async () => {
      try {
        if (!isPlaying) {
          await channelAudio.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
          startBlink();
        } else {
          channelAudio.pause();
          isPlaying = false;
          audioBtn.classList.remove('playing');
          audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
          stopBlink();
        }
      } catch (err) {
        console.error('Audio play failed:', err);
        showFeedback(texts[currentLang].feedback_retry);
      }
    });

    // keyboard accessibility for play button
    audioBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); audioBtn.click(); }
    });

    // when audio ends
    channelAudio.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      stopBlink();
      showFeedback(texts[currentLang].feedback_good);
    });

    // handle play error event (some browsers)
    channelAudio.addEventListener('error', (e) => {
      console.warn('channelAudio error event', e);
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      stopBlink();
      showFeedback(texts[currentLang].feedback_retry);
    });
  } else {
    // missing audio or button - log for debugging
    if (!channelAudio) console.warn('channelAudio element missing on page.');
    if (!audioBtn) console.warn('audioBtn element missing on page.');
  }

  // Replay behavior: restart audio from 0 and play digit-by-digit visualization
  if (replayBtn && channelAudio) {
    replayBtn.addEventListener('click', async () => {
      try {
        channelAudio.currentTime = 0;
        await channelAudio.play();
        isPlaying = true;
        audioBtn && audioBtn.classList.add('playing');
        audioBtn && (audioBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>');
        replayBtn.classList.add('replay-glow');
        setTimeout(() => replayBtn.classList.remove('replay-glow'), 380);
        startBlink();
      } catch (err) {
        console.error('Replay failed', err);
        showFeedback(texts[currentLang].feedback_retry);
      }
    });

    replayBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replayBtn.click(); }
    });
  }

  // Optional quiz
  if (enableQuiz && quizArea) {
    quizArea.classList.remove('visually-hidden');
    quizArea.setAttribute('aria-hidden', 'false');
  }
  if (enableQuiz && quizForm && quizFeedback) {
    quizForm.addEventListener('change', (e) => {
      const val = e.target.value;
      if (!val) return;
      if (val === (SECTION.correct_answer || '16')) {
        quizFeedback.className = 'alert alert-success mt-2';
        quizFeedback.textContent = '✅ Correct — Channel 16 is the emergency channel.';
        quizFeedback.classList.remove('d-none');
        showFeedback(texts[currentLang].feedback_good);
      } else {
        quizFeedback.className = 'alert alert-danger mt-2';
        quizFeedback.textContent = '❌ Not correct. Try replaying the example.';
        quizFeedback.classList.remove('d-none');
      }
    });
  }

  // Next navigation — prefer server-generated continueLink href, else use SECTION.start_next_section (name), else fallback path
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      // prefer real href attribute on continueLink if present
      const hrefFromContinue = continueLink && continueLink.getAttribute('href');
      if (hrefFromContinue) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(() => { window.location.href = hrefFromContinue; }, 260);
        return;
      }

      // next section name provided in SECTION.start_next_section (e.g. 'vhf' or 'input_vhf')
      if (SECTION.start_next_section) {
        // build path consistent with your Flask route: /learn/unit/<id>/<section>
        const unitId = window.UNIT_ID || 1;
        const path = `/learn/unit/${unitId}/${SECTION.start_next_section}`;
        window.location.href = path;
        return;
      }

      // last resort fallback: try replacing 'channel' to 'vhf' in current path
      const fallback = window.location.pathname.replace('channel', 'vhf').replace('channel', 'input_vhf');
      window.location.href = fallback;
    });

    nextBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
    });
  }

  // small CSS injection for blink & feedback if not already present
  const style = document.createElement('style');
  style.innerHTML = `
    .radio-screen.active { box-shadow: 0 0 18px rgba(16,185,129,0.9); transform: translateY(-2px); transition: box-shadow 0.12s, transform 0.12s; }
    .replay-glow { box-shadow: 0 10px 26px rgba(37,99,235,0.2); transform: translateY(-3px); }
    .pop-visible { animation: popIn 0.36s ease; }
  `;
  document.head.appendChild(style);

});
