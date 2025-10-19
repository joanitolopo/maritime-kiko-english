// input_mmsi.js (revised)
// Data-driven MMSI page: robust digit-by-digit playback using fresh Audio instances,
// isPlaying guard, fallback timeout, and cleaned digit parsing.

document.addEventListener('DOMContentLoaded', function() {
  const playButtons = Array.from(document.querySelectorAll('.play-card'));
  const feedback = document.getElementById('feedback-bubble');
  const feedbackContent = feedback ? feedback.querySelector('.fb-content') : null;
  const langToggle = document.getElementById('lang-toggle-btn');
  const instructionText = document.getElementById('instruction-text');
  const nextBtn = document.getElementById('next-btn');
  const continueLink = document.getElementById('continue-link');

  // injected from template
  const SECTION = window.SECTION_CONTENT || {};
  const UNIT = window.UNIT_CONTENT || {};
  const UNIT_ID = window.UNIT_ID || 1;

  const texts = {
    en: {
      instruction: SECTION.instruction_en || "Listen to the MMSI numbers carefully. Repeat them aloud, digit by digit.",
      feedback_good: SECTION.default_feedback || "Great! You repeated the MMSI clearly.",
      feedback_retry: "Not clear enough. Replay and try again."
    },
    id: {
      instruction: SECTION.instruction_id || "Dengarkan nomor MMSI dengan saksama. Ulangi dengan suara keras, angka demi angka.",
      feedback_good: SECTION.default_feedback_id || "Bagus! Kamu mengulang MMSI dengan jelas.",
      feedback_retry: "Belum jelas. Putar ulang dan coba lagi."
    }
  };
  let currentLang = 'en';
  let isPlaying = false; // prevent concurrent plays

  // global digit audio map (shared across units)
  const DIGIT_AUDIO = {
    "0": "/static/data/audio/numbers/0_zeero.wav",
    "1": "/static/data/audio/numbers/1_wun.wav",
    "2": "/static/data/audio/numbers/2_too.wav",
    "3": "/static/data/audio/numbers/3_tree.wav",
    "4": "/static/data/audio/numbers/4_fower.wav",
    "5": "/static/data/audio/numbers/5_fife.wav",
    "6": "/static/data/audio/numbers/6_six.wav",
    "7": "/static/data/audio/numbers/7_seven.wav",
    "8": "/static/data/audio/numbers/8_eight.wav",
    "9": "/static/data/audio/numbers/9_niner.wav"
  };

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

  function wrapDigitsIfNeeded(containerEl) {
    if (!containerEl) return;
    if (containerEl.dataset.wrapped) return;
    const text = containerEl.textContent.trim();
    const chars = text.split('');
    containerEl.innerHTML = chars.map(c => `<span class="digit">${c}</span>`).join('');
    containerEl.dataset.wrapped = '1';
  }

  function blinkDigit(containerEl, idx) {
    if (!containerEl) return;
    const spans = containerEl.querySelectorAll('.digit');
    spans.forEach(s => s.classList.remove('blink'));
    if (spans[idx]) spans[idx].classList.add('blink');
  }
  function clearBlink(containerEl) {
    if (!containerEl) return;
    const spans = containerEl.querySelectorAll('.digit');
    spans.forEach(s => s.classList.remove('blink'));
  }

  // create a fresh Audio instance for each playback and wait for ended or timeout
  function playAudioOnce(src, timeout = 6000) {
    return new Promise((resolve, reject) => {
      if (!src) return resolve(); // nothing to play
      const a = new Audio(src);
      a.preload = 'auto';
      let finished = false;
      const onEnded = () => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve();
      };
      const onError = (e) => {
        if (finished) return;
        finished = true;
        cleanup();
        reject(new Error('audio error'));
      };
      const t = setTimeout(() => {
        if (finished) return;
        finished = true;
        cleanup();
        // treat timeout as finished but warn
        console.warn('audio play timeout for', src);
        resolve();
      }, timeout);

      function cleanup() {
        clearTimeout(t);
        try { a.pause(); } catch(e){}
        a.removeEventListener('ended', onEnded);
        a.removeEventListener('error', onError);
      }

      a.addEventListener('ended', onEnded, { once: true });
      a.addEventListener('error', onError, { once: true });

      // try play, if rejected (autoplay blocked), reject so caller can fallback
      a.play().catch(err => {
        // reject to let caller fallback gracefully
        onError(err);
      });
    });
  }

  // play digits sequentially using fresh audio objects for each digit
  async function playDigitsSequence(containerEl, mmsi) {
    if (!containerEl || !mmsi) return;
    // prevent double start
    if (isPlaying) return;
    isPlaying = true;
    wrapDigitsIfNeeded(containerEl);

    // sanitize to digits only
    const digits = mmsi.replace(/\D+/g, '').split('');
    if (digits.length === 0) {
      isPlaying = false;
      return;
    }

    for (let i = 0; i < digits.length; i++) {
      const d = digits[i];
      blinkDigit(containerEl, i);
      const src = DIGIT_AUDIO[d];
      if (src) {
        try {
          // play fresh audio; timeout ~ 4s per digit (adjust if your audio longer)
          await playAudioOnce(src, 4000);
        } catch (err) {
          console.warn('digit audio failed for', d, err);
          // continue to next digit
        }
      } else {
        // no audio mapping: small pause so user can read blinking
        await new Promise(r => setTimeout(r, 300));
      }
      // short gap between digits
      await new Promise(r => setTimeout(r, 140));
    }

    clearBlink(containerEl);
    isPlaying = false;
  }

  // high level: play an example object (either replay_audio, audio_sequence, or digits)
  async function playExample(exampleObj, containerEl, playBtn) {
    if (isPlaying) return; // guard
    if (!exampleObj || !containerEl) return;
    if (playBtn) playBtn.classList.add('playing');

    try {
      if (exampleObj.replay_audio) {
        // attempt to play full file. If it fails, fallback to digits.
        try {
          await playAudioOnce(exampleObj.replay_audio, 20000);
        } catch (err) {
          console.warn('replay_audio failed, fallback to digits', err);
          await playDigitsSequence(containerEl, exampleObj.mmsi);
        }
      } else if (exampleObj.audio_sequence && Array.isArray(exampleObj.audio_sequence) && exampleObj.audio_sequence.length) {
        // play provided sequence (fresh audio per path)
        wrapDigitsIfNeeded(containerEl);
        for (let i = 0; i < exampleObj.audio_sequence.length; i++) {
          blinkDigit(containerEl, i);
          try {
            await playAudioOnce(exampleObj.audio_sequence[i], 4000);
          } catch (e) { console.warn('audio_sequence item failed', exampleObj.audio_sequence[i], e); }
          await new Promise(r => setTimeout(r, 140));
        }
        clearBlink(containerEl);
      } else {
        // digit-by-digit
        await playDigitsSequence(containerEl, exampleObj.mmsi);
      }
      showFeedback(texts[currentLang].feedback_good);
    } catch (err) {
      console.error('playExample error', err);
      showFeedback(texts[currentLang].feedback_retry);
    } finally {
      if (playBtn) {
        playBtn.classList.remove('playing');
        playBtn.classList.add('glow-complete');
        setTimeout(() => playBtn.classList.remove('glow-complete'), 420);
      }
      // ensure blink cleared
      clearBlink(containerEl);
      isPlaying = false;
    }
  }

  // wire up play buttons
  playButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = btn.dataset.target;
      if (!target) return;
      const idx = parseInt(target, 10) - 1;
      const exampleObj = (SECTION.examples && SECTION.examples[idx]) ? SECTION.examples[idx] : null;
      const container = document.getElementById(`mmsi-${target}`);
      // if no example in JSON, fallback to reading container text
      const fallback = { mmsi: container ? container.textContent.trim() : '' };
      await playExample(exampleObj || fallback, container, btn);
    });
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); btn.click(); }
    });
  });

  // wire up replay buttons (if any). prefer replay_audio else trigger card play
  (SECTION.examples || []).forEach((ex, i) => {
    const idx = i + 1;
    const replayBtn = document.getElementById(`replay-${idx}`);
    if (!replayBtn) return;
    replayBtn.addEventListener('click', async () => {
      // if replay_audio exists, play it (fresh instance)
      const playBtn = document.querySelector(`.play-card[data-target="${idx}"]`);
      if (ex.replay_audio) {
        try {
          await playAudioOnce(ex.replay_audio, 20000);
        } catch (err) {
          console.warn('replay_audio play failed, fallback to card play', err);
          playBtn && playBtn.click();
        }
      } else {
        // trigger the card button which will run digit-by-digit
        playBtn && playBtn.click();
      }
      replayBtn.classList.add('replay-glow');
      setTimeout(() => replayBtn.classList.remove('replay-glow'), 420);
    });
  });

  // lang toggle: swap instruction text only
  if (langToggle && instructionText) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      instructionText.textContent = texts[currentLang].instruction;
    });
  }

  // next navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const nextHref = continueLink && continueLink.href;
      if (nextHref) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(() => { window.location.href = nextHref; }, 240);
      } else {
        alert('Next section belum dikonfigurasi untuk unit ini.');
      }
    });
    nextBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
    });
  }

  // small CSS helpers
  const css = document.createElement('style');
  css.innerHTML = `
    .digit { display:inline-block; padding:0 2px; }
    .digit.blink { background: rgba(255,255,255,0.18); border-radius:4px; transform: translateY(-2px); transition: background 0.15s, transform 0.12s; }
    .btn-audio.glow-complete { box-shadow: 0 8px 22px rgba(37,99,235,0.28); transform: translateY(-3px); }
    .btn-replay.replay-glow { box-shadow: 0 8px 22px rgba(37,99,235,0.28); transform: translateY(-3px); }
    .play-card.playing { opacity: 0.85; transform: scale(0.98); }
  `;
  document.head.appendChild(css);

  // cleanup on unload
  window.addEventListener('beforeunload', () => {
    // nothing to pause (we create fresh audio per playback), but keep this for safety
  });
});
