// static/js/controlled_ex_4.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const UNIT = window.UNIT_CONTENT || {};
  const ships = SECTION.ships || [{ name: 'ANTARA' }];

  // UI
  const shipNameEl = document.getElementById('ship-name');
  const lettersGrid = document.getElementById('letters-grid');
  const outputWords = document.getElementById('output-words');
  const replayBtn = document.getElementById('replay-output');
  const feedback = document.getElementById('ex4-feedback');
  const fbContent = document.getElementById('fb-content');
  const nextBtn = document.getElementById('ex4-next');
  const progressEl = document.getElementById('progress');
  const langToggle = document.getElementById('ex4-lang-toggle');
  const instructionText = document.getElementById('instruction-text');

  // Mapping letter -> NATO word & audio path (consistent with earlier pages)
  const NATO = {
    A: { word: 'Alpha', audio: '/static/data/audio/alphabet/a_alpha.wav' },
    B: { word: 'Bravo', audio: '/static/data/audio/alphabet/b_bravo.wav' },
    C: { word: 'Charlie', audio: '/static/data/audio/alphabet/c_charlie.wav' },
    D: { word: 'Delta', audio: '/static/data/audio/alphabet/d_delta.wav' },
    E: { word: 'Echo', audio: '/static/data/audio/alphabet/e_echo.wav' },
    F: { word: 'Foxtrot', audio: '/static/data/audio/alphabet/f_foxtrot.wav' },
    G: { word: 'Golf', audio: '/static/data/audio/alphabet/g_golf.wav' },
    H: { word: 'Hotel', audio: '/static/data/audio/alphabet/h_hotel.wav' },
    I: { word: 'India', audio: '/static/data/audio/alphabet/i_india.wav' },
    J: { word: 'Juliett', audio: '/static/data/audio/alphabet/j_juliett.wav' },
    K: { word: 'Kilo', audio: '/static/data/audio/alphabet/k_kilo.wav' },
    L: { word: 'Lima', audio: '/static/data/audio/alphabet/l_lima.wav' },
    M: { word: 'Mike', audio: '/static/data/audio/alphabet/m_mike.wav' },
    N: { word: 'November', audio: '/static/data/audio/alphabet/n_november.wav' },
    O: { word: 'Oscar', audio: '/static/data/audio/alphabet/o_oscar.wav' },
    P: { word: 'Papa', audio: '/static/data/audio/alphabet/p_papa.wav' },
    Q: { word: 'Quebec', audio: '/static/data/audio/alphabet/q_quebec.wav' },
    R: { word: 'Romeo', audio: '/static/data/audio/alphabet/r_romeo.wav' },
    S: { word: 'Sierra', audio: '/static/data/audio/alphabet/s_sierra.wav' },
    T: { word: 'Tango', audio: '/static/data/audio/alphabet/t_tango.wav' },
    U: { word: 'Uniform', audio: '/static/data/audio/alphabet/u_uniform.wav' },
    V: { word: 'Victor', audio: '/static/data/audio/alphabet/v_victor.wav' },
    W: { word: 'Whiskey', audio: '/static/data/audio/alphabet/w_whiskey.wav' },
    X: { word: 'Xray', audio: '/static/data/audio/alphabet/x_xray.wav' },
    Y: { word: 'Yankee', audio: '/static/data/audio/alphabet/y_yankee.wav' },
    Z: { word: 'Zulu', audio: '/static/data/audio/alphabet/z_zulu.wav' },
  };

  // Preload letter audios
  const audioCache = {};
  Object.keys(NATO).forEach(letter => {
    try {
      const a = new Audio(NATO[letter].audio);
      a.preload = 'auto';
      audioCache[letter] = a;
    } catch (e) { console.warn('Audio preload failed', letter, e); }
  });

  let currentIndex = 0;     // which ship
  let selectedLetters = []; // user's clicks for current ship
  let expectedLetters = []; // target letters array

  function setShip(index) {
    currentIndex = index;
    const ship = ships[currentIndex];
    const name = (ship && ship.name) ? ship.name.toUpperCase().replace(/[^A-Z]/g,'') : 'ANTARA';
    shipNameEl.textContent = name;
    expectedLetters = name.split('');
    selectedLetters = [];
    outputWords.textContent = '—';
    progressEl.textContent = `${currentIndex+1}/${ships.length}`;
    // clear any selected classes
    document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('selected','wrong'));
    // disable next until all ships done
    nextBtn.disabled = true;
  }

  // typing effect for output words array
  function renderOutputTyping(arr) {
    if (!arr || !arr.length) { outputWords.textContent = '—'; return; }
    // show progressively: we simply show joined with " – "
    outputWords.textContent = arr.join(' – ');
  }

  // show feedback bubble
  function showFeedback(message, good = true) {
    if (!feedback) return;
    fbContent.textContent = message;
    feedback.classList.remove('visually-hidden');
    setTimeout(()=> feedback.classList.add('visually-hidden'), 2400);
  }

  // when a letter btn clicked
  function onLetterClick(e) {
    const btn = e.currentTarget;
    const L = btn.dataset.letter;
    // ignore if already filled full length
    if (selectedLetters.length >= expectedLetters.length) return;
    // mark selected (visual)
    btn.classList.add('selected');
    selectedLetters.push(L);
    // update output with NATO words
    const words = selectedLetters.map(x => NATO[x] ? NATO[x].word : x);
    renderOutputTyping(words);

    // play single letter audio immediately
    const aud = audioCache[L];
    if (aud) {
      try {
        aud.currentTime = 0;
        aud.play().catch(()=>{});
      } catch(e){}
    }

    // if sequence complete, validate
    if (selectedLetters.length === expectedLetters.length) {
      validateSequence();
    }
  }

  // wrong animation on mismatch
  function markWrong() {
    // vibrate wrong briefly on last selected button
    const last = selectedLetters[selectedLetters.length - 1];
    const btn = document.querySelector(`.letter-btn[data-letter="${last}"]`);
    if (btn) {
      btn.classList.add('wrong');
      setTimeout(()=> btn.classList.remove('wrong'), 420);
    }
  }

  // validate when full-length entered
  function validateSequence() {
    const ok = selectedLetters.join('') === expectedLetters.join('');
    if (ok) {
      // success: show message, progress, enable next if last ship else advance button becomes active after user presses Next
      showFeedback(`${section_texts().success_prefix} ${shipNameEl.textContent} ${section_texts().success_suffix}`, true);
      // small celebration: play concatenated audio of letters
      playSequenceAudio(selectedLetters);
      // allow Next (if last ship enable Next to wrap-up; otherwise enable Next to go to next ship)
      nextBtn.disabled = false;
      // also mark completed visually
      document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('selected'));
      // temporarily show correct output
      renderOutputTyping(selectedLetters.map(x => NATO[x].word));
    } else {
      // wrong
      showFeedback(section_texts().wrong, false);
      markWrong();
      // clear selection after short pause so user can retry
      setTimeout(()=> {
        selectedLetters = [];
        renderOutputTyping([]);
        document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('selected'));
      }, 700);
    }
  }

  // Play a sequence of audios for given letters sequentially
  async function playSequenceAudio(letters) {
    if (!letters || !letters.length) return;
    for (let i=0;i<letters.length;i++) {
      const l = letters[i];
      const a = audioCache[l];
      if (!a) continue;
      try {
        a.currentTime = 0;
        await a.play();
        // wait for ended (use event once)
        await new Promise(res => a.addEventListener('ended', res, { once: true }));
      } catch (err) {
        // ignore play errors
      }
      // small gap
      await new Promise(r=>setTimeout(r, 120));
    }
  }

  // replay button: replay current output (splice expected letters if not yet correct use selectedLetters)
  replayBtn.addEventListener('click', async () => {
    const seq = (selectedLetters.length === expectedLetters.length && selectedLetters.join('') === expectedLetters.join('')) ? expectedLetters : selectedLetters;
    if (!seq || seq.length === 0) {
      // nothing: play full expected as guidance
      await playSequenceAudio(expectedLetters);
      return;
    }
    await playSequenceAudio(seq);
  });

  // Next button: if more ships, go to next; if finished, follow data-next href
  nextBtn.addEventListener('click', () => {
    if (currentIndex < ships.length - 1) {
      setShip(currentIndex + 1);
    } else {
      const href = nextBtn.dataset.next;
      if (href) window.location.href = href;
    }
    // reset UI
    selectedLetters = [];
    renderOutputTyping([]);
    nextBtn.disabled = true;
  });

  // language toggle texts
  function section_texts() {
    const en = {
      success_prefix: '✅ Correct!',
      success_suffix: 'is spelled clearly.',
      wrong: 'Not quite. Try again. Remember to use the NATO words.'
    };
    const id = {
      success_prefix: '✅ Benar!',
      success_suffix: 'dieja dengan jelas.',
      wrong: 'Belum tepat. Coba lagi. Ingat gunakan kata kode NATO.'
    };
    return (lang === 'id') ? id : en;
  }

  // language control
  let lang = 'en';
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      lang = (lang === 'en') ? 'id' : 'en';
      langToggle.textContent = lang.toUpperCase();
      instructionText.textContent = (SECTION['instruction_' + lang] || instructionText.textContent);
    });
  }

  // wire up letter buttons
  document.querySelectorAll('.letter-btn').forEach(btn => {
    btn.addEventListener('click', onLetterClick);
    btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
  });

  // initialize ships list & UI
  function init() {
    // ensure ships array has at least 1
    if (!ships || !ships.length) ships = [{ name: 'ANTARA' }];
    progressEl.textContent = `0/${ships.length}`;
    setShip(0);
  }
  init();

  // cleanup audios when leaving page
  window.addEventListener('beforeunload', () => {
    Object.values(audioCache).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
  });
});
