// input_numbers.js
// Interactive numbers grid (0-9) — global mapping + unit-specific practice via SECTION

document.addEventListener('DOMContentLoaded', function() {
  const gridButtons = Array.from(document.querySelectorAll('.number-tile'));
  const radioIndicator = document.getElementById('radio-indicator');
  const screenNumber = document.getElementById('screen-number');
  const feedback = document.getElementById('feedback-bubble');
  const feedbackContent = feedback ? feedback.querySelector('.fb-content') : null;
  const practiceReplay = document.getElementById('practice-replay');
  const practiceText = document.getElementById('practice-text');
  const langToggle = document.getElementById('lang-toggle-btn');
  const instructionText = document.getElementById('instruction-text');
  const nextBtn = document.getElementById('next-btn');
  const continueLink = document.getElementById('continue-link');

  const UNIT = window.UNIT_CONTENT || {};
  const SECTION = window.SECTION_CONTENT || {};
  const UNIT_ID = window.UNIT_ID || 1;

  const texts = {
    en: {
      instruction: "Click a number to hear how it is said on the radio.",
      practice: "Example: YB321 → Yankee – Bravo – Tree – Too – Wun",
      feedback_good: "Good! You sounded clear.",
      feedback_retry: "Not clear enough. Replay and try again."
    },
    id: {
      instruction: "Klik angka untuk mendengar cara penyebutannya di radio.",
      practice: "Contoh: YB321 → Yankee – Bravo – Tree – Too – Wun",
      feedback_good: "Bagus! Kamu terdengar jelas.",
      feedback_retry: "Belum jelas. Putar ulang dan coba lagi."
    }
  };

  // -------------------------------
  // GLOBAL NUMBERS MAP (shared)
  // -------------------------------
  // Put all number audio files in /static/data/audio/numbers/
  const GLOBAL_NUMBERS_MAP = {
    "0": "/static/data/audio/numbers/0_zeero.wav",   // ZEE-ro
    "1": "/static/data/audio/numbers/1_wun.wav",     // WUN
    "2": "/static/data/audio/numbers/2_too.wav",     // TOO
    "3": "/static/data/audio/numbers/3_tree.wav",    // TREE
    "4": "/static/data/audio/numbers/4_fower.wav",   // FOWER
    "5": "/static/data/audio/numbers/5_fife.wav",    // FIFE
    "6": "/static/data/audio/numbers/6_six.wav",
    "7": "/static/data/audio/numbers/7_seven.wav",
    "8": "/static/data/audio/numbers/8_eight.wav",
    "9": "/static/data/audio/numbers/9_niner.wav"     // NIN-er
  };

  let currentLang = 'en';
  let clickedSet = new Set();
  let audioCache = {};
  let playing = false;
  let blinkTimeout = null;

  // Preload audios — use 'let' in closure so number captured correctly
  Object.keys(GLOBAL_NUMBERS_MAP).forEach(num => {
    const path = GLOBAL_NUMBERS_MAP[num];
    if (!path) return;
    const a = new Audio(path);
    a.preload = 'auto';
    // capture num per-audio with dedicated listeners
    a.addEventListener('ended', () => {
      stopRadioBlink();
      playing = false;
    });
    // when play starts, set screen number properly
    a.addEventListener('play', () => {
      if (screenNumber) screenNumber.textContent = num;
    });
    audioCache[num] = a;
  });

  function startRadioBlink(num) {
    if (!radioIndicator || !screenNumber) return;
    radioIndicator.classList.add('active');
    screenNumber.textContent = String(num);
    if (blinkTimeout) clearTimeout(blinkTimeout);
    blinkTimeout = setTimeout(() => stopRadioBlink(), 5000);
  }
  function stopRadioBlink() {
    if (!radioIndicator || !screenNumber) return;
    radioIndicator.classList.remove('active');
    screenNumber.textContent = '—';
    if (blinkTimeout) { clearTimeout(blinkTimeout); blinkTimeout = null; }
  }

  function showFeedback(message) {
    if (!feedback || !feedbackContent) return;
    feedbackContent.textContent = message;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    setTimeout(() => {
      feedback.classList.add('visually-hidden');
      feedback.classList.remove('pop-visible');
    }, 3000);
  }

  // Attach events to number tiles
  gridButtons.forEach(btn => {
    const num = String(btn.dataset.number);

    btn.addEventListener('click', async () => {
      if (playing) return;
      const audio = audioCache[num];
      if (!audio) {
        console.warn('No audio for number', num);
        showFeedback(texts[currentLang].feedback_retry);
        return;
      }
      try {
        playing = true;
        startRadioBlink(num);
        audio.currentTime = 0;
        await audio.play();
        btn.classList.add('clicked');
        btn.setAttribute('aria-pressed','true');
        clickedSet.add(num);
        if (clickedSet.size > 0 && clickedSet.size % 3 === 0) {
          showFeedback(texts[currentLang].feedback_good);
        }
      } catch (err) {
        console.error('Audio play failed for number', num, err);
        showFeedback(texts[currentLang].feedback_retry);
        stopRadioBlink();
        playing = false;
      }
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });

  // Practice replay: use SECTION.practice_audio if available, else fallback to built sequence
  let practiceAudio = null;
  if (SECTION && SECTION.practice_audio) {
    practiceAudio = new Audio(SECTION.practice_audio);
    practiceAudio.preload = 'auto';
    // ensure radio blink when playing numbers in practice audio isn't required;
    // if practice_audio contains digit-by-digit audio, it's fine.
  }

  practiceReplay && practiceReplay.addEventListener('click', async () => {
    if (practiceAudio) {
      try { await practiceAudio.play(); return; } catch (e) { console.warn('practiceAudio play failed', e); }
    }
    // fallback: sequence from SECTION.practice_sequence or default Y B 3 2 1
    const seq = (SECTION && Array.isArray(SECTION.practice_sequence) && SECTION.practice_sequence.length)
                ? SECTION.practice_sequence
                : ['Y','B','3','2','1'];

    // helper to play item (letter or number)
    const playItem = (item) => {
      return new Promise(async (resolve) => {
        if (/[0-9]/.test(item)) {
          const aud = audioCache[item];
          if (!aud) { resolve(); return; }
          startRadioBlink(item);
          aud.currentTime = 0;
          aud.play().then(() => {
            aud.addEventListener('ended', function onend() {
              aud.removeEventListener('ended', onend);
              stopRadioBlink();
              resolve();
            });
          }).catch((err) => { console.warn('playItem error', err); stopRadioBlink(); resolve(); });
        } else {
          // letter: try global alphabet audio path (shared), names assumed under /static/data/audio/alphabet/
          const path = `/static/data/audio/alphabet/${item.toLowerCase()}_${item.toLowerCase()}.wav`;
          const a = new Audio(path);
          try {
            a.preload = 'auto';
            await a.play();
            a.addEventListener('ended', () => resolve(), { once: true });
          } catch(e) { console.warn('letter play fallback failed', e); resolve(); }
        }
      });
    };

    // sequentially play
    (async () => {
      playing = true;
      for (let i=0;i<seq.length;i++){
        await playItem(seq[i]);
        await new Promise(r => setTimeout(r, 180));
      }
      playing = false;
    })();
  });

  // Language toggle
  if (langToggle && instructionText && practiceText) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      instructionText.textContent = texts[currentLang].instruction;
      practiceText.textContent = SECTION.practice_text || texts[currentLang].practice;
    });
  }

  // Next navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const next = nextBtn.dataset.next || (continueLink && continueLink.href);
      if (next) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(()=> { window.location.href = next; }, 220);
      } else {
        alert('Next section belum dikonfigurasi untuk unit ini.');
      }
    });
    nextBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
    });
  }

  // cleanup
  window.addEventListener('beforeunload', () => {
    Object.values(audioCache).forEach(a => { try { a.pause(); } catch(e){} });
  });
});
