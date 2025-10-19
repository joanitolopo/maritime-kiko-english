// input_alphabet.js
document.addEventListener('DOMContentLoaded', function() {
  const gridButtons = Array.from(document.querySelectorAll('.letter-tile'));
  const feedback = document.getElementById('feedback-bubble');
  const feedbackContent = feedback ? feedback.querySelector('.fb-content') : null;
  const practiceReplay = document.getElementById('practice-replay');
  const practiceTextEl = document.getElementById('practice-text');
  const langToggle = document.getElementById('lang-toggle-btn');
  const instructionText = document.getElementById('instruction-text');
  const nextBtn = document.getElementById('next-btn');
  const continueLink = document.getElementById('continue-link');

  const UNIT = window.UNIT_CONTENT || {};
  const SECTION = window.SECTION_CONTENT || {};
  const UNIT_ID = window.UNIT_ID || 1;

  const texts = {
    en: {
      instruction: "Click a letter to hear its NATO phonetic code word. Then, repeat it aloud.",
      practice: "Example: ANTARA → Alpha – November – Tango – Alpha – Romeo – Alpha",
      feedback_good: "Excellent! You sounded like a real sailor.",
      feedback_retry: "Not clear enough. Try again after the audio."
    },
    id: {
      instruction: "Klik sebuah huruf untuk mendengar kata kode fonetik NATO. Lalu, ulangi dengan suara keras.",
      practice: "Contoh: ANTARA → Alpha – November – Tango – Alpha – Romeo – Alpha",
      feedback_good: "Bagus! Kamu terdengar seperti pelaut sejati.",
      feedback_retry: "Belum jelas. Coba lagi setelah audio."
    }
  };

  // -------------------------------
  // GLOBAL ALPHABET MAP (shared)
  // -------------------------------
  // Single source for all units — adjust paths to where your audio assets are stored.
  // Put A–Z audio files in: /static/data/audio/alphabet/
  const GLOBAL_ALPHABET_MAP = {
    A: '/static/data/audio/alphabet/a_alpha.wav',
    B: '/static/data/audio/alphabet/b_bravo.wav',
    C: '/static/data/audio/alphabet/c_charlie.wav',
    D: '/static/data/audio/alphabet/d_delta.wav',
    E: '/static/data/audio/alphabet/e_echo.wav',
    F: '/static/data/audio/alphabet/f_foxtrot.wav',
    G: '/static/data/audio/alphabet/g_golf.wav',
    H: '/static/data/audio/alphabet/h_hotel.wav',
    I: '/static/data/audio/alphabet/i_india.wav',
    J: '/static/data/audio/alphabet/j_juliett.wav',
    K: '/static/data/audio/alphabet/k_kilo.wav',
    L: '/static/data/audio/alphabet/l_lima.wav',
    M: '/static/data/audio/alphabet/m_mike.wav',
    N: '/static/data/audio/alphabet/n_november.wav',
    O: '/static/data/audio/alphabet/o_oscar.wav',
    P: '/static/data/audio/alphabet/p_papa.wav',
    Q: '/static/data/audio/alphabet/q_quebec.wav',
    R: '/static/data/audio/alphabet/r_romeo.wav',
    S: '/static/data/audio/alphabet/s_sierra.wav',
    T: '/static/data/audio/alphabet/t_tango.wav',
    U: '/static/data/audio/alphabet/u_uniform.wav',
    V: '/static/data/audio/alphabet/v_victor.wav',
    W: '/static/data/audio/alphabet/w_whiskey.wav',
    X: '/static/data/audio/alphabet/x_xray.wav',
    Y: '/static/data/audio/alphabet/y_yankee.wav',
    Z: '/static/data/audio/alphabet/z_zulu.wav'
  };

  let currentLang = 'en';
  let clickedSet = new Set();
  let audioCache = {};
  let playing = false;

  // Preload audio objects from GLOBAL_ALPHABET_MAP
  Object.keys(GLOBAL_ALPHABET_MAP).forEach(letter => {
    const path = GLOBAL_ALPHABET_MAP[letter];
    if (!path) return;
    const a = new Audio(path);
    a.preload = 'auto';
    audioCache[letter] = a;
    a.addEventListener('ended', () => { playing = false; });
  });

  function showFeedback(message) {
    if (!feedback) return;
    feedbackContent.textContent = message;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    setTimeout(() => {
      feedback.classList.add('visually-hidden');
      feedback.classList.remove('pop-visible');
    }, 3000);
  }

  // Attach events to each letter tile
  gridButtons.forEach(btn => {
    const letter = (btn.dataset.letter || '').toUpperCase();
    btn.addEventListener('click', async () => {
      if (playing) return;
      const audio = audioCache[letter];
      if (!audio) {
        console.warn('No audio for', letter);
        showFeedback(texts[currentLang].feedback_retry);
        return;
      }
      try {
        playing = true;
        audio.currentTime = 0;
        await audio.play();
        btn.classList.add('clicked');
        btn.setAttribute('aria-pressed', 'true');
        clickedSet.add(letter);
        if (clickedSet.size > 3 && clickedSet.size % 3 === 1) {
          showFeedback(texts[currentLang].feedback_good);
        }
      } catch (err) {
        console.error('Audio play failed for', letter, err);
        showFeedback(texts[currentLang].feedback_retry);
        playing = false;
      }
    });

    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        btn.click();
      }
    });
  });

  // Practice replay: use SECTION.practice_audio if provided, else fall back to example sequence
  let practiceAudio = null;
  if (SECTION && SECTION.practice_audio) {
    practiceAudio = new Audio(SECTION.practice_audio);
    practiceAudio.preload = 'auto';
  }

  practiceReplay && practiceReplay.addEventListener('click', async () => {
    if (practiceAudio) {
      try { await practiceAudio.play(); return; } catch (e) { console.warn('practice audio play failed', e); }
    }
    // fallback sequence (ANTARA) or SECTION.practice_sequence if provided as array ['A','N',...]
    const seq = (SECTION && Array.isArray(SECTION.practice_sequence) && SECTION.practice_sequence.length) ? SECTION.practice_sequence : ['A','N','T','A','R','A'];
    let idx = 0;
    playing = true;
    const playSeq = () => {
      if (idx >= seq.length) { playing = false; return; }
      const a = audioCache[seq[idx]];
      if (!a) { idx++; return playSeq(); }
      a.currentTime = 0;
      a.play().then(() => {
        a.addEventListener('ended', function onend() {
          a.removeEventListener('ended', onend);
          idx++;
          setTimeout(playSeq, 200);
        });
      }).catch(err => {
        console.error('Seq play err', err);
        idx++;
        setTimeout(playSeq, 120);
      });
    };
    playSeq();
  });

  // Language toggle only swaps UI text & practice_text copy
  if (langToggle && instructionText && practiceTextEl) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      instructionText.textContent = texts[currentLang].instruction;
      practiceTextEl.textContent = SECTION.practice_text || texts[currentLang].practice;
    });
  }

  // Next button navigation uses data-next injected in template
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const next = nextBtn.dataset.next || (continueLink && continueLink.href);
      if (next) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(() => { window.location.href = next; }, 180);
      } else {
        alert('Next section belum dikonfigurasi untuk unit ini.');
      }
    });
    nextBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
    });
  }
});
